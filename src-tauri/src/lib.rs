use std::process::Command;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn play_in_mpv(url: String) -> Result<(), String> {
    Command::new("mpv")
        .arg(&url)
        .spawn()
        .map_err(|e| format!("Failed to launch MPV: {}", e))?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, play_in_mpv])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
