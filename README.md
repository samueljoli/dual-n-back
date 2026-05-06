# Dual N-Back

A desktop dual n-back trainer built with Tauri, Rust, Svelte, and Vite.

<img width="5088" height="3356" alt="image" src="https://github.com/user-attachments/assets/2ff2ff7b-9c4f-434c-98df-e2020b627a42" />


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

## Features

### Debug Mode

**Shows correct answers during play and an animated n-back replay after the round.**

<img width="5088" height="3356" alt="image" src="https://github.com/user-attachments/assets/79d43528-2615-400e-ad64-20d615356c21" />

**Displays auditory and visual matches at the end of the match**

<img width="5088" height="3356" alt="image" src="https://github.com/user-attachments/assets/84046b0c-84aa-46dd-b0ce-8bb7acf46b6b" />


