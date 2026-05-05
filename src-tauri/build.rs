//! Tauri build-script entrypoint.
//!
//! Generates compile-time context from `tauri.conf.json` and bundled assets.

fn main() {
    tauri_build::build()
}
