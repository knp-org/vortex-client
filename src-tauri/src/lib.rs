use std::io::{Read, Write};
use std::process::{Child, Command};
use std::sync::Mutex;

/// Tracks the embedded mpv process and its JSON IPC socket.
#[derive(Default)]
struct MpvState {
    child: Option<Child>,
    socket: Option<String>,
    pid: Option<u32>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Returns the host OS ("linux" | "macos" | "windows") so the frontend can
/// gate native-mpv playback (currently Linux/X11 only).
#[tauri::command]
fn get_os() -> String {
    std::env::consts::OS.to_string()
}

/// Send a single JSON IPC command to mpv and return its raw reply.
fn ipc_command(socket: &str, json_line: &str) -> Result<String, String> {
    #[cfg(unix)]
    {
        use std::os::unix::net::UnixStream;
        let mut stream = UnixStream::connect(socket).map_err(|e| e.to_string())?;
        stream
            .set_read_timeout(Some(std::time::Duration::from_millis(500)))
            .ok();
        let mut msg = json_line.to_string();
        msg.push('\n');
        stream.write_all(msg.as_bytes()).map_err(|e| e.to_string())?;
        let mut buf = vec![0u8; 8192];
        let n = stream.read(&mut buf).map_err(|e| e.to_string())?;
        Ok(String::from_utf8_lossy(&buf[..n]).to_string())
    }
    #[cfg(not(unix))]
    {
        let _ = (socket, json_line);
        Err("mpv IPC is only supported on Unix".into())
    }
}

/// Send a command and return the parsed reply object (the line carrying "error").
fn ipc_request(socket: &str, json_line: &str) -> Result<serde_json::Value, String> {
    let resp = ipc_command(socket, json_line)?;
    for line in resp.lines() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
            // replies have an "error" field; async events have "event" — skip those.
            if v.get("error").is_some() {
                return Ok(v);
            }
        }
    }
    Err("no reply from mpv".into())
}

/// Read a single mpv property, returning `None` on any failure.
fn get_prop(socket: &str, prop: &str) -> Option<serde_json::Value> {
    let req = format!("{{\"command\":[\"get_property\",\"{}\"]}}", prop);
    ipc_request(socket, &req).ok().and_then(|v| v.get("data").cloned())
}

#[derive(serde::Serialize)]
struct MpvSnapshot {
    time: f64,
    duration: f64,
    paused: bool,
    volume: f64,
    aid: serde_json::Value,
    sid: serde_json::Value,
}

/// Quit any running mpv instance and reap the process. Kills the entire process
/// group with SIGKILL so playback can never be orphaned (back button, app close,
/// or starting a new video).
fn kill_mpv(state: &Mutex<MpvState>) {
    let (sock, child, pid) = {
        let mut g = state.lock().unwrap();
        (g.socket.take(), g.child.take(), g.pid.take())
    };
    if let Some(sock) = sock {
        let _ = ipc_command(&sock, "{\"command\":[\"quit\"]}");
        let _ = std::fs::remove_file(&sock);
    }
    // SIGKILL the whole process group (mpv was spawned into its own group).
    #[cfg(unix)]
    if let Some(pid) = pid {
        unsafe { libc::kill(-(pid as i32), libc::SIGKILL); }
    }
    #[cfg(not(unix))]
    let _ = pid;
    if let Some(mut child) = child {
        let _ = child.kill();
        let _ = child.wait();
    }
}

#[tauri::command]
fn mpv_stop(state: tauri::State<Mutex<MpvState>>) -> Result<(), String> {
    kill_mpv(state.inner());
    Ok(())
}

/// Current playback position in seconds. Errors once mpv has exited (the IPC
/// socket becomes unreachable), which the frontend uses to detect "playback
/// ended / user quit" and return to the app.
#[tauri::command]
fn mpv_get_time(state: tauri::State<Mutex<MpvState>>) -> Result<f64, String> {
    let socket = {
        let guard = state.lock().unwrap();
        guard.socket.clone().ok_or("mpv not running")?
    };
    let resp = ipc_command(&socket, "{\"command\":[\"get_property\",\"playback-time\"]}")?;
    // The reply may interleave async event lines, so scan for the one with `data`.
    for line in resp.lines() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
            if let Some(d) = v.get("data").and_then(|d| d.as_f64()) {
                return Ok(d);
            }
        }
    }
    Err("no playback-time".into())
}

/// Send an arbitrary mpv command (e.g. ["set_property","pause",true],
/// ["seek", 120, "absolute"], ["set_property","aid",2]). Driven by the
/// HTML overlay controls.
#[tauri::command]
fn mpv_command(state: tauri::State<Mutex<MpvState>>, args: Vec<serde_json::Value>) -> Result<(), String> {
    let socket = {
        let guard = state.lock().unwrap();
        guard.socket.clone().ok_or("mpv not running")?
    };
    let body = serde_json::json!({ "command": args }).to_string();
    ipc_request(&socket, &body)?;
    Ok(())
}

/// Snapshot of playback state for the overlay controls. Errors once mpv has
/// exited (socket unreachable) so the overlay can close and return to the app.
#[tauri::command]
fn mpv_state(state: tauri::State<Mutex<MpvState>>) -> Result<MpvSnapshot, String> {
    let socket = {
        let guard = state.lock().unwrap();
        guard.socket.clone().ok_or("mpv not running")?
    };
    // First request doubles as a liveness check (errors if mpv is gone).
    let first = ipc_request(&socket, "{\"command\":[\"get_property\",\"playback-time\"]}")?;
    let time = first.get("data").and_then(|v| v.as_f64()).unwrap_or(0.0);
    Ok(MpvSnapshot {
        time,
        duration: get_prop(&socket, "duration").and_then(|v| v.as_f64()).unwrap_or(0.0),
        paused: get_prop(&socket, "pause").and_then(|v| v.as_bool()).unwrap_or(false),
        volume: get_prop(&socket, "volume").and_then(|v| v.as_f64()).unwrap_or(100.0),
        aid: get_prop(&socket, "aid").unwrap_or(serde_json::Value::Null),
        sid: get_prop(&socket, "sid").unwrap_or(serde_json::Value::Null),
    })
}

#[cfg(target_os = "linux")]
fn window_xid(window: &tauri::WebviewWindow) -> Option<u64> {
    use raw_window_handle::{HasWindowHandle, RawWindowHandle};
    match window.window_handle().ok()?.as_raw() {
        RawWindowHandle::Xlib(h) => Some(h.window),
        RawWindowHandle::Xcb(h) => Some(h.window.get() as u64),
        _ => None,
    }
}

/// Embed mpv inside the app window (X11) to direct-play `url`, resuming at
/// `start_seconds`. mpv's OSC provides in-video controls.
#[cfg(target_os = "linux")]
#[tauri::command]
fn mpv_play(
    window: tauri::WebviewWindow,
    state: tauri::State<Mutex<MpvState>>,
    url: String,
    start_seconds: f64,
) -> Result<(), String> {
    kill_mpv(state.inner());

    // The native window id must be read on the GTK main thread.
    let (tx, rx) = std::sync::mpsc::channel();
    let win = window.clone();
    window
        .run_on_main_thread(move || {
            let _ = tx.send(window_xid(&win));
        })
        .map_err(|e| e.to_string())?;
    let xid = rx
        .recv()
        .map_err(|e| e.to_string())?
        .ok_or("Could not read X11 window id (embedded mpv requires an X11 session)")?;

    let socket = std::env::temp_dir()
        .join(format!("vortex-mpv-{}.sock", std::process::id()))
        .to_string_lossy()
        .to_string();
    let _ = std::fs::remove_file(&socket);

    let mut cmd = Command::new("mpv");
    cmd.arg(format!("--wid={}", xid))
        .arg(format!("--input-ipc-server={}", socket))
        .arg(format!("--start={}", start_seconds.max(0.0)))
        .arg("--osc=no")
        // Keep default key bindings so q/Esc can always quit the video as a
        // fallback if the overlay window doesn't receive input on some WMs.
        .arg("--force-window=yes")
        .arg("--keep-open=no")
        .arg("--hwdec=no") // hardware acceleration disabled by default
        .arg("--really-quiet")
        .arg(&url);

    // Run mpv in its own process group so we can SIGKILL the whole group and
    // never leave playback orphaned.
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        cmd.process_group(0);
    }

    let child = cmd
        .spawn()
        .map_err(|e| format!("Failed to launch mpv: {}. Is mpv installed?", e))?;

    let mut guard = state.lock().unwrap();
    guard.pid = Some(child.id());
    guard.child = Some(child);
    guard.socket = Some(socket);
    Ok(())
}

#[cfg(not(target_os = "linux"))]
#[tauri::command]
fn mpv_play(_url: String, _start_seconds: f64) -> Result<(), String> {
    Err("Embedded mpv playback is currently only supported on Linux".into())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::Manager;

    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Mutex::new(MpvState::default()))
        .invoke_handler(tauri::generate_handler![
            greet,
            get_os,
            mpv_play,
            mpv_stop,
            mpv_get_time,
            mpv_command,
            mpv_state
        ])
        // Kill mpv if the main window is closed (don't leave playback orphaned).
        .on_window_event(|window, event| {
            if window.label() == "main"
                && matches!(
                    event,
                    tauri::WindowEvent::Destroyed | tauri::WindowEvent::CloseRequested { .. }
                )
            {
                if let Some(state) = window.try_state::<Mutex<MpvState>>() {
                    kill_mpv(state.inner());
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    // Kill mpv on app exit as a final safety net.
    app.run(|app_handle, event| {
        if matches!(event, tauri::RunEvent::ExitRequested { .. } | tauri::RunEvent::Exit) {
            if let Some(state) = app_handle.try_state::<Mutex<MpvState>>() {
                kill_mpv(state.inner());
            }
        }
    });
}
