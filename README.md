# Dual N-Back

A desktop dual n-back trainer built with Tauri, Rust, Svelte, and Vite.

## Develop

Use Nix for the dev environment:

```bash
nix develop
just
```

Common commands:

```bash
just install      # install JS deps
just dev          # run Vite frontend
just desktop      # run Tauri desktop app
just verify       # test, type-check, build, cargo check
```

## Controls

- `F`: Sound Match
- `J`: Position Match
- `Space` / `Enter`: start round
- `Esc`: return home

## Notes

Debug mode in Settings shows correct answers during play and an animated n-back replay after the round.
