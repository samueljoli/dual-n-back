//! Desktop binary entrypoint.
//!
//! Delegates to the library crate so Tauri can reuse the same startup path for
//! other targets.

fn main() {
    dual_n_back_lib::run()
}
