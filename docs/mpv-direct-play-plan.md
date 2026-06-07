# Plan: Embed mpv for direct play in the Linux app

## Context

In the Tauri Linux app, HTML5 `<video>` direct play is unreliable and limited (codec/container support, performance). The goal is Jellyfin-style native playback: when the server says a file is **direct-play** (no transcode), the desktop app should hand the stream to **mpv embedded inside the app window** instead of the `<video>` element. Transcoded/HLS content keeps using hls.js in-app.

**Why this matters (transcoding):** mpv (ffmpeg under the hood) decodes virtually any codec/container — HEVC, VP9, AV1, MKV, AVI, AC3/E-AC3/DTS/TrueHD, etc. So with mpv as the player the server can **direct-play almost everything** (just serve bytes) instead of running CPU-heavy transcodes; transcoding becomes the rare exception (remote bitrate caps, explicit settings). There is also an existing mismatch this fixes: `detectCapabilities()` in `src/types/player.ts` already advertises a *broad* profile when running in Tauri, so the server already returns `needs_transcode:false` for most files — but those URLs are fed to a WebKitGTK `<video>` element that **cannot** decode HEVC/MKV/AC3/etc., so direct play silently fails in the Linux app today. Routing direct play to mpv makes that broad profile truthful.

Decisions made with the user:
- **Embed mpv inside the app window** (not a separate window), controls via **mpv's built-in OSC**; the HTML layer provides shell concerns (resume position, title, progress save, return-to-app).
- **Auto-trigger on direct play** (Linux desktop only for now; macOS/Windows come later).
- **Backend = the system `mpv` binary embedded via X11 `--wid` + JSON IPC.** Rationale: `libmpv-dev`/`libmpv.so` are not installed; linking libmpv needs `sudo apt install libmpv-dev` and the maintained `libmpv2` crate likely needs a newer libmpv than the distro's 0.34.1. The binary `--wid` approach gives the same embedded result with no system install or crate-version risk. Linking libmpv can be a later upgrade.

Environment facts: session is **X11** (`DISPLAY=:1`), webview is **WebKitGTK 4.1**, Tauri **v2**, `mpv` present at `/usr/bin/mpv`. On X11+WebKitGTK a native mpv child window composites **above** the webview, so HTML controls cannot overlay the video — hence mpv OSC is used for in-video controls.

## Approach

When `streamInfo.needs_transcode === false` and the app is the **Linux Tauri** build, call a new Rust command that spawns `mpv --wid=<app-window-XID>` so mpv reparents into and fills the Tauri window (covering the React player page). mpv's OSC handles seek/pause/volume/track selection. The frontend polls playback position over mpv's IPC socket to save resume progress, and navigates back when mpv exits. Auth uses the already-implemented `?token=` query param (server `auth_middleware` accepts it) plus an `Authorization` HTTP header passed to mpv.

## Rust changes — `src-tauri/src/lib.rs` (+ `Cargo.toml`)

Add dep: `raw-window-handle = "0.6"` (matches Tauri v2) to extract the X11 window id. Use Tauri managed state to hold the running mpv child + IPC socket path.

New `#[tauri::command]`s (registered in `invoke_handler`):
- `get_os() -> String` — returns `std::env::consts::OS` so the frontend can gate on `"linux"` (avoids adding the `plugin-os` permission/registration).
- `mpv_play(window: tauri::WebviewWindow, url: String, start_seconds: f64) -> Result<(), String>`:
  - Resolve XID: `window.window_handle()` → `RawWindowHandle::Xlib(h) => h.window` (fallback `Xcb`). Error clearly if not X11.
  - Stop any existing mpv first (idempotent).
  - Generate a per-launch IPC socket path under the OS temp dir (e.g. `/tmp/vortex-mpv-<pid|uuid>.sock`).
  - Spawn:
    ```
    mpv --wid=<XID>
        --input-ipc-server=<sock>
        --start=<start_seconds>
        --osc=yes --force-window=yes
        --http-header-fields=Authorization: Bearer <token-from-url-or-arg>
        --really-quiet
        <url>
    ```
    (Token: simplest is to pass the already-`withAuthToken`'d URL from the frontend and skip the header; keep one source of truth. Header optional.)
  - Store `Child` + socket path in state. Spawn a thread that `wait()`s on the child and emits a `mpv-exited` event to the window on exit.
- `mpv_stop() -> Result<(), String>` — send `{"command":["quit"]}` over the IPC socket if reachable, else `child.kill()`; clear state.
- `mpv_get_time() -> Result<f64, String>` — open the stored `UnixStream`, write `{"command":["get_property","playback-time"]}\n`, read the JSON reply, return `data`. Used for progress.

IPC helper: small fn that connects `std::os::unix::net::UnixStream` to the socket, writes a command line, reads one response line, parses with `serde_json`.

Cleanup: on `mpv_stop`, child exit, and app/window close, ensure the child is killed and the socket file removed.

## Frontend changes

- **OS gate:** add a tiny helper (e.g. in `src/services` or a `useNativeMpv` hook) that caches `invoke('get_os')` and exposes `isLinuxDesktop = isTauri && os === 'linux'`. Reuse `usePlatform` (`src/hooks/usePlatform.ts`) for the Tauri check.
- **`src/pages/Player.tsx` `setupPlayer`:** after fetching `streamInfo`, before the existing HLS/direct branches, add:
  ```
  if (isLinuxDesktop && !streamInfo.needs_transcode) {
      await invoke('mpv_play', {
          url: withAuthToken(resolveUrl(streamInfo.direct_stream_url)),
          startSeconds: savedPosition,
      });
      // start progress polling + listen for 'mpv-exited'
      return; // skip <video>/hls setup
  }
  ```
  - Progress poll: `setInterval` (~10s) → `invoke('mpv_get_time')` → `api.post('/media/:id/progress', {position, total_duration})` (reuse the existing progress endpoint and `duration` from `streamInfo.duration_seconds`). Keep the last position to save on exit.
  - `listen('mpv-exited', ...)` (from `@tauri-apps/api/event`) → save final progress, then `navigate(-1)`.
  - Cleanup effect: `invoke('mpv_stop')` + clear interval + unlisten on unmount.
  - While mpv is active, render a minimal "Playing in mpv — press q/Esc to return" state (it sits behind mpv anyway).
- **`src/components/NativePlayerButton.tsx`:** fix the existing bug — it passes an un-authed URL. Point it at `withAuthToken(resolveUrl(...))` and route it through `mpv_play` for consistency (keep as a manual fallback, e.g. for transcoded content). The old `play_in_mpv` / `greet` commands can be removed once unused.

Reuse existing utilities: `withAuthToken`, `resolveUrl` (`src/services/api.ts`), the `?token=` server support already added in `vortex-server/src/api/middleware.rs`, and `StreamInfo.needs_transcode/direct_stream_url/duration_seconds` (`src/types/player.ts`).

## Packaging / prerequisites

- Requires the `mpv` binary at runtime. For Linux distribution, declare mpv as a package dependency or bundle it; for the future macOS/Windows apps, embedding uses different handles (NSView/HWND) and is out of scope here (the `get_os` gate keeps them on `<video>` until implemented).

## Risks / things to verify

- `--wid` focus/input handling under WebKitGTK — confirm OSC + keyboard work and that quitting mpv (`q`/`Esc`) returns control to the app.
- mpv resizing with the parent window (mpv tracks `ConfigureNotify`; verify on resize/fullscreen).
- Ensure mpv is always killed on navigation/app close (no orphan windows).

## Verification (end-to-end)

1. `sudo` not required. Rebuild: `cargo build` in `src-tauri` (via `tauri dev`), restart the app.
2. Restart `vortex-server` so the `?token=` middleware is live (already built).
3. In the Linux app, open a direct-play title (e.g. an MP4/MKV the server marks `needs_transcode:false`): mpv should appear embedded in the window and start at the resumed position, with the OSC visible.
4. Seek/pause via OSC; let it play >10s; check the server `playback_progress` row updates.
5. Press `q`/`Esc`: app returns to the previous screen and final progress is saved; confirm no orphan mpv process/window.
6. Open a transcode-required title: confirm it still plays via hls.js in the in-app `<video>` (mpv path skipped).
7. Web app: confirm playback unchanged (mpv path gated off).
