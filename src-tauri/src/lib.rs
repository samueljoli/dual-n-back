//! Native desktop shell for the Dual N-Back trainer.
//!
//! The Svelte frontend currently owns gameplay, scoring, and UI state. The
//! Rust side is intentionally small: it boots Tauri, installs native plugins,
//! and hosts the WebView. Future native capabilities should be added here as
//! explicit Tauri commands instead of leaking platform APIs into UI code.

/// Starts the Tauri application.
///
/// This function is shared by the desktop binary and Tauri's mobile entrypoint
/// convention. It should stay focused on application bootstrapping; domain
/// logic belongs in the frontend `src/lib` modules until a concrete native
/// boundary is needed.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
