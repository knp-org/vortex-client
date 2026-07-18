# Vortex Client

The official cross-platform client for **Vortex**, a high-performance self-hosted
media server. Stream movies and TV, and read books and comics, from your own server.

This repository holds two clients:

| Client | Stack | Location |
| --- | --- | --- |
| **Web & Desktop** | React 19 · TypeScript · Vite · Tauri | repo root / [`src/`](./src) |
| **Android** | Kotlin · Jetpack Compose · Media3 (ExoPlayer) | [`android_app/`](./android_app) |

Both follow the **"Liquid Glass"** design language — see [DESIGN.md](./DESIGN.md).

---

## Web & Desktop app

React + Vite single-page app. The same build runs in the browser and, via
[Tauri](https://tauri.app/), as a native desktop app (Linux/Windows/macOS) with an
embedded mpv backend for high-performance playback.

### Prerequisites
- **Node 22+** (the build will fail on older Node)
- For desktop builds: the [Tauri prerequisites](https://tauri.app/start/prerequisites/)
  (Rust toolchain + system WebKitGTK on Linux)
- On Linux, the system packages needed by Tauri/WebKitGTK:
  ```bash
  sudo apt-get update
  sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget file \
    libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev xdg-utils
  ```
- **[`liquid-glass-ui`](https://github.com/knp-org/liquid-glass-ui)** checked out
  as a sibling of this repo. `package.json` resolves `@knp-org/liquid-glass-ui`
  from a packed tarball at `../liquid-glass-ui/`, so build it once before
  installing:
  ```bash
  git clone https://github.com/knp-org/liquid-glass-ui.git ../liquid-glass-ui
  cd ../liquid-glass-ui
  npm install    # runs tsup and builds dist/
  npm pack       # produces knp-org-liquid-glass-ui-<version>.tgz
  cd -
  ```
  If the packed version differs from the one pinned in `package.json`, point the
  dependency at the new tarball with
  `npm install ../liquid-glass-ui/knp-org-liquid-glass-ui-*.tgz`.
  (CI does all of this automatically — see
  [.github/workflows/release.yml](./.github/workflows/release.yml).)

### Getting started
```bash
npm install
npm run dev          # Vite dev server on http://localhost:1420
npm run tauri dev    # run the native desktop app
```

The dev server proxies `/api` to the Vortex server at `http://127.0.0.1:3000`
(see [vite.config.ts](./vite.config.ts)). In the packaged app, the server URL is
configurable in Settings.

### Building
```bash
npm run lint         # ESLint — also checks the architecture boundaries
npm run build        # eslint + tsc + vite production build (run before pushing)
npm run build:deb        # Tauri desktop bundle (.deb)
npm run build:appimage   # Tauri desktop bundle (AppImage)
```

> Node 22 is required. If your system `node` is older, point at the right one,
> e.g. `export PATH=/usr/local/bin:$PATH`.

### Project structure
The web client uses a pragmatic **feature-sliced** architecture
(`app → features → shared`) with ESLint-enforced module boundaries. Read
**[ARCHITECTURE.md](./ARCHITECTURE.md)** before adding code, and
[src/features/README.md](./src/features/README.md) for a per-feature index.

---

## Android app

Native Kotlin + Jetpack Compose app in [`android_app/`](./android_app), using
Media3/ExoPlayer for playback, Hilt for DI, and Retrofit for the API.

```bash
cd android_app
./gradlew assembleDebug      # build a debug APK
# or open the android_app/ folder in Android Studio and Run
```

The server URL and auth are configured in-app on first launch.

---

## Documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) — how the web client is organized and the rules for changing it
- [DESIGN.md](./DESIGN.md) — the "Liquid Glass" UI/UX design system
- [src/features/README.md](./src/features/README.md) — per-feature responsibilities and public APIs
