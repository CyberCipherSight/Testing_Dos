(() => {
  "use strict";

  const BUNDLE_URL = "Turboc3.zip";

  const $ = (id) => document.getElementById(id);
  const ui = {
    container: $("dos-container"),
    emptyState: $("emptyState"),
    statusPill: $("statusPill"),
    statusText: $("statusText"),
    startBtn: $("startBtn"),
    restartBtn: $("restartBtn"),
    pauseBtn: $("pauseBtn"),
    saveBtn: $("saveBtn"),
    fullscreenBtn: $("fullscreenBtn"),
    stopBtn: $("stopBtn"),
    diagnosticsBtn: $("diagnosticsBtn"),
    diagnosticsPanel: $("diagnosticsPanel"),
    runDiagnosticsBtn: $("runDiagnosticsBtn"),
    checks: $("checks"),
    clearLogBtn: $("clearLogBtn"),
    log: $("log"),
  };

  let player = null;
  let commandInterface = null;
  let paused = false;
  let booting = false;

  function timestamp() {
    return new Date().toISOString().replace("T", " ").replace("Z", " UTC");
  }

  function log(message, data) {
    const suffix = data === undefined
      ? ""
      : ` ${typeof data === "string" ? data : JSON.stringify(data)}`;
    ui.log.textContent += `[${timestamp()}] ${message}${suffix}\n`;
    ui.log.scrollTop = ui.log.scrollHeight;
    console.log(`[Turbo C3] ${message}`, data ?? "");
  }

  function setStatus(state, text) {
    ui.statusPill.dataset.state = state;
    ui.statusText.textContent = text;
  }

  function setControls(running) {
    ui.startBtn.disabled = running || booting;
    ui.restartBtn.disabled = !running || booting;
    ui.pauseBtn.disabled = !running || booting;
    ui.saveBtn.disabled = !running || booting;
    ui.fullscreenBtn.disabled = !running || booting;
    ui.stopBtn.disabled = !running || booting;
  }

  function showEmptyState() {
    if (!document.getElementById("emptyState")) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.id = "emptyState";
      empty.innerHTML = `
        <div class="terminal-mark" aria-hidden="true">C:\\&gt;_</div>
        <h2>Ready to boot</h2>
        <p>Start the emulator to launch <code>TURBOC3\\BIN\\TC.EXE</code>.</p>`;
      ui.container.appendChild(empty);
      ui.emptyState = empty;
    }
  }

  function hideEmptyState() {
    document.getElementById("emptyState")?.remove();
  }

  function renderChecks(checks) {
    ui.checks.replaceChildren();
    for (const check of checks) {
      const card = document.createElement("div");
      card.className = "check";
      card.dataset.result = check.result;

      const title = document.createElement("strong");
      title.textContent = check.name;

      const detail = document.createElement("span");
      detail.textContent = check.detail;

      card.append(title, detail);
      ui.checks.appendChild(card);
    }
  }

  async function probeBundle() {
    const response = await fetch(BUNDLE_URL, { method: "HEAD", cache: "no-store" });
    if (!response.ok) {
      throw new Error(`${BUNDLE_URL} returned HTTP ${response.status}`);
    }
    const bytes = Number(response.headers.get("content-length"));
    return Number.isFinite(bytes) && bytes > 0
      ? `${(bytes / 1024 / 1024).toFixed(2)} MiB`
      : "reachable";
  }

  async function runDiagnostics() {
    ui.runDiagnosticsBtn.disabled = true;
    log("Running environment checks...");

    const checks = [];
    const add = (name, result, detail) => checks.push({ name, result, detail });

    add(
      "Protocol",
      location.protocol === "file:" ? "fail" : "pass",
      location.protocol === "file:"
        ? "Use an HTTP server; file:// cannot run js-dos correctly."
        : `${location.protocol}//`
    );

    add(
      "WebAssembly",
      typeof WebAssembly === "object" ? "pass" : "fail",
      typeof WebAssembly === "object" ? "Available" : "Required but unavailable"
    );

    add(
      "js-dos",
      typeof window.Dos === "function" ? "pass" : "fail",
      typeof window.Dos === "function" ? "Player API loaded" : "js-dos.min.js did not load"
    );

    add(
      "IndexedDB",
      "indexedDB" in window ? "pass" : "warn",
      "indexedDB" in window ? "Available for local persistence" : "Local persistence may be unavailable"
    );

    add(
      "SharedArrayBuffer",
      typeof SharedArrayBuffer === "function" ? "pass" : "warn",
      typeof SharedArrayBuffer === "function"
        ? "Available"
        : "Unavailable; some threaded optimizations may be disabled"
    );

    try {
      const bundleInfo = await probeBundle();
      add("Turbo C3 bundle", "pass", `${BUNDLE_URL} • ${bundleInfo}`);
    } catch (error) {
      add("Turbo C3 bundle", "fail", error.message);
    }

    renderChecks(checks);
    const failed = checks.filter((check) => check.result === "fail");
    if (failed.length) {
      setStatus("error", `${failed.length} check${failed.length === 1 ? "" : "s"} failed`);
      log("Diagnostics completed with failures", failed.map((item) => item.name));
    } else {
      if (!player) setStatus("ready", "Ready");
      log("Diagnostics complete");
    }

    ui.runDiagnosticsBtn.disabled = false;
    return failed.length === 0;
  }

  async function stopPlayer({ quiet = false } = {}) {
    if (!player) {
      if (!quiet) setStatus("ready", "Ready");
      return;
    }

    const current = player;
    player = null;
    commandInterface = null;
    paused = false;

    try {
      await current.stop();
      if (!quiet) log("Emulator stopped");
    } catch (error) {
      log("Stop failed", error?.message || String(error));
    }

    ui.container.replaceChildren();
    showEmptyState();
    ui.pauseBtn.textContent = "Pause";
    setControls(false);
    if (!quiet) setStatus("ready", "Ready");
  }

  async function boot() {
    if (booting) return;
    booting = true;
    setControls(Boolean(player));
    setStatus("loading", "Starting...");
    log("Starting Turbo C3");

    try {
      if (location.protocol === "file:") {
        throw new Error("Open this project through HTTP, not file://. Example: python3 -m http.server 8080");
      }
      if (typeof window.Dos !== "function") {
        throw new Error("js-dos failed to load. Check js-dos.min.js.");
      }

      await probeBundle();
      await stopPlayer({ quiet: true });
      hideEmptyState();

      player = window.Dos(ui.container, {
        url: BUNDLE_URL,
        autoStart: true,
        autoSave: true,
        theme: "dark",
        backend: "dosbox",
        backendLocked: true,
        imageRendering: "pixelated",
        renderAspect: "4/3",
        fsChanges: { local: true },
        onEvent: (event, arg) => {
          log(`js-dos event: ${event}`);

          if (event === "emu-ready") {
            const version = typeof player?.getVersion === "function" ? player.getVersion() : null;
            if (version) log("js-dos version", version);
          }

          if (event === "ci-ready") {
            commandInterface = arg || null;
            setStatus("running", "Turbo C3 running");
            setControls(true);
            ui.container.focus?.();
          }
        },
      });

      if (typeof player.setNoCloud === "function") {
        player.setNoCloud(true);
      }

      setControls(true);
    } catch (error) {
      log("Startup failed", error?.stack || error?.message || String(error));
      await stopPlayer({ quiet: true });
      setStatus("error", "Startup failed");
      setControls(false);
      ui.diagnosticsPanel.hidden = false;
      ui.diagnosticsBtn.setAttribute("aria-expanded", "true");
      await runDiagnostics();
    } finally {
      booting = false;
      setControls(Boolean(player));
    }
  }

  async function restart() {
    log("Restart requested");
    await stopPlayer({ quiet: true });
    await boot();
  }

  async function saveState() {
    if (!player) return;
    try {
      const saved = await player.save();
      log(saved ? "Local emulator state saved" : "Save request completed without new changes");
    } catch (error) {
      log("Save failed", error?.message || String(error));
      setStatus("error", "Save failed");
    }
  }

  function togglePause() {
    if (!player || typeof player.setPaused !== "function") return;
    paused = !paused;
    player.setPaused(paused);
    ui.pauseBtn.textContent = paused ? "Resume" : "Pause";
    setStatus(paused ? "loading" : "running", paused ? "Paused" : "Turbo C3 running");
    log(paused ? "Emulation paused" : "Emulation resumed");
  }

  function enterFullscreen() {
    if (!player || typeof player.setFullScreen !== "function") return;
    player.setFullScreen(true);
    log("Fullscreen requested");
  }

  function toggleDiagnostics() {
    const willOpen = ui.diagnosticsPanel.hidden;
    ui.diagnosticsPanel.hidden = !willOpen;
    ui.diagnosticsBtn.setAttribute("aria-expanded", String(willOpen));
  }

  ui.startBtn.addEventListener("click", boot);
  ui.restartBtn.addEventListener("click", restart);
  ui.pauseBtn.addEventListener("click", togglePause);
  ui.saveBtn.addEventListener("click", saveState);
  ui.fullscreenBtn.addEventListener("click", enterFullscreen);
  ui.stopBtn.addEventListener("click", () => stopPlayer());
  ui.diagnosticsBtn.addEventListener("click", toggleDiagnostics);
  ui.runDiagnosticsBtn.addEventListener("click", runDiagnostics);
  ui.clearLogBtn.addEventListener("click", () => { ui.log.textContent = ""; });

  window.addEventListener("error", (event) => {
    log("Window error", event.message || String(event.error || event));
  });

  window.addEventListener("unhandledrejection", (event) => {
    log("Unhandled promise rejection", event.reason?.stack || event.reason?.message || String(event.reason));
  });

  document.addEventListener("DOMContentLoaded", async () => {
    setControls(false);
    log("Turbo C3 Web Lab initialized");
    const ok = await runDiagnostics();
    if (ok) setStatus("ready", "Ready");
  });
})();
