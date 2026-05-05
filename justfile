set dotenv-load := false

default:
    just --list

install:
    npm install

dev:
    npm run dev

desktop:
    npm run tauri:dev

check:
    npm run check

test:
    npm run test

build:
    npm run build

cargo-check:
    cd src-tauri && cargo check

verify: test check build cargo-check
