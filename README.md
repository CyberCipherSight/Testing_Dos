# Turbo C3 Web Lab

A browser-hosted Turbo C3 / Turbo C++ DOS development environment powered by **js-dos**.

The project launches the legacy Turbo C3 environment from a modern browser without requiring a local DOSBox or Turbo C installation. `Turboc3.zip` is treated as the source archive; the browser combines it with `.jsdos/dosbox.conf` to build a valid js-dos bundle at runtime and starts `TURBOC3\BIN\TC.EXE`.

## What this project does

- Runs Turbo C3 directly in a modern browser.
- Builds a valid js-dos runtime bundle in-browser from `Turboc3.zip` plus `.jsdos/dosbox.conf`.
- Starts the emulator through the supported js-dos player API.
- Provides start, restart, pause/resume, save-state, fullscreen, and stop controls.
- Persists local filesystem changes through js-dos/IndexedDB when supported.
- Uses a stable save key even though the runtime bundle is created as a temporary Blob URL.
- Includes browser, archive, and bundle-builder diagnostics with a runtime log.
- Works as a static site; no application backend is required.

## Architecture

```text
Browser
  |
  +-- index.html
  |    +-- styles.css
  |    +-- app.js
  |    +-- js-dos.min.css
  |    +-- js-dos.min.js
  |    +-- js-dos emulators bundle builder
  |
  +-- app.js
       |
       +-- fetch Turboc3.zip
       +-- fetch .jsdos/dosbox.conf
       +-- build valid js-dos bundle in memory
       |
       +-- js-dos / WebAssembly DOS runtime
              |
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

The repository contains a `.vscode/settings.json` configuration for Live Server. Start Live Server from the repository root and open the generated localhost URL.

## Startup configuration

The DOS startup configuration is stored in:

```text
.jsdos/dosbox.conf
```

It mounts the runtime filesystem, enters `TURBOC3\BIN`, and launches:

```text
TC.EXE
```

The page injects this configuration into a js-dos bundle at runtime. This avoids depending on undocumented JavaScript startup options and also means the committed `Turboc3.zip` does not need to be trusted to already contain correct js-dos metadata.

## Diagnostics

Open **Diagnostics** in the page to inspect:

- HTTP/file protocol status
- WebAssembly support
- js-dos player availability
- js-dos bundle-builder availability
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
├── Turboc3.zip           # source archive
├── app.js                # bundle builder + emulator controller
├── index.html            # web UI
├── styles.css            # responsive UI styling
├── js-dos.min.css
└── js-dos.min.js
```

## External runtime dependency

The page loads the current js-dos emulator bundle-builder from:

```text
https://v8.js-dos.com/latest/emulators/emulators.js
```

The DOS runtime may also load js-dos emulator deployment files from js-dos infrastructure. For a fully offline deployment, those runtime assets should be vendored into the repository and `pathPrefix` should be pointed at the local copy.

## Notes

- The emulator wrapper is intentionally separated from the legacy Turbo C files.
- Local save-state behavior depends on browser storage availability.
- Replacing `Turboc3.zip` does not require manually editing the archive to add `.jsdos/dosbox.conf`; the page injects the config while building the runtime bundle.

## Redistribution notice

Turbo C/Turbo C++ is legacy third-party software. Before redistributing its binaries publicly, verify that you have the legal right to distribute the included copy. The js-dos wrapper code and the legacy compiler binaries have separate licensing considerations.
