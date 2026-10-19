# Turbo C3 Web Lab

A browser-hosted Turbo C3 / Turbo C++ DOS development environment powered by **js-dos**.

The project packages the legacy Turbo C3 environment so it can be launched from a modern browser without installing DOSBox or Turbo C locally. The browser runs the DOS environment through WebAssembly and starts the Turbo C IDE from `TURBOC3\BIN\TC.EXE`.

## What this project does

- Runs Turbo C3 directly in a modern browser.
- Uses the local `Turboc3.zip` bundle as the DOS filesystem.
- Starts the emulator through the supported js-dos player API.
- Provides start, restart, pause/resume, save-state, fullscreen, and stop controls.
- Persists local filesystem changes through js-dos/IndexedDB when supported.
- Includes browser and bundle diagnostics with a runtime log.
- Works as a static site; no backend is required.

## Architecture

```text
Browser
  |
  +-- index.html
  |    +-- styles.css
  |    +-- app.js
  |    +-- js-dos.min.css
  |    +-- js-dos.min.js
  |
  +-- js-dos / WebAssembly DOS runtime
         |
         +-- Turboc3.zip
                |
                +-- .jsdos/dosbox.conf
                +-- TURBOC3/
                     +-- BIN/TC.EXE
                     +-- INCLUDE/
                     +-- LIB/
                     +-- BGI/
                     +-- Projects/
```

## Run locally

Do **not** open `index.html` directly with `file://`. Serve the repository over HTTP.

### Python

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

### VS Code Live Server

The repository also contains a `.vscode/settings.json` configuration for Live Server. Start Live Server from the repository root and open the generated localhost URL.

## Bundle startup

The DOS startup configuration is maintained in `.jsdos/dosbox.conf` and should also be present inside the runtime js-dos bundle. It launches:

```text
TURBOC3\BIN\TC.EXE
```

For current js-dos v7/v8, startup configuration belongs in the js-dos bundle rather than in a custom JavaScript `command` option.

## Diagnostics

Open **Diagnostics** in the page to inspect:

- HTTP/file protocol status
- WebAssembly support
- js-dos player availability
- IndexedDB availability
- SharedArrayBuffer availability
- `Turboc3.zip` reachability and reported size
- js-dos runtime events and errors

`SharedArrayBuffer` is treated as an optimization warning rather than a hard requirement because browser isolation policies vary.

## Repository layout

```text
.
├── .jsdos/
│   └── dosbox.conf
├── .vscode/
│   └── settings.json
├── TURBOC3/              # extracted legacy environment
├── Turboc3.zip           # runtime bundle
├── app.js                # application/emulator controller
├── index.html            # web UI
├── styles.css            # responsive UI styling
├── js-dos.min.css
└── js-dos.min.js
```

## Notes

- The emulator wrapper is intentionally separated from the legacy Turbo C files.
- Local save-state behavior depends on browser storage availability.
- If the bundle is replaced, keep `.jsdos/dosbox.conf` in the bundle and preserve the expected `TURBOC3` path.

## Redistribution notice

Turbo C/Turbo C++ is legacy third-party software. Before redistributing its binaries publicly, verify that you have the legal right to distribute the included copy. The js-dos wrapper code and the legacy compiler binaries have separate licensing considerations.
