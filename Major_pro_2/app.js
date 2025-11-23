console.log("LibBGI global:", window.LibBGI);

document.addEventListener("DOMContentLoaded", function () {
    console.log("App.js loaded");

    const editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
        lineNumbers: true,
        mode: "text/x-c++src"
    });

    let userCode = editor.getValue();
    editor.on("change", cm => userCode = cm.getValue());

    const runButton = document.getElementById("run-button");
    const graphicsCanvas = document.getElementById("canvas");

    let wasmModule = null;
    let wasmReady  = false;

    runButton.disabled = true;
    runButton.textContent = "Loading WebAssembly...";

    console.log("Loading real WebAssembly module...");

    LibBGI({
        canvas: graphicsCanvas                     // critical fix
    })
    .then(instance => {
        console.log("REAL WebAssembly loaded:", instance);
        wasmModule = instance;
        wasmReady  = true;

        runButton.disabled = false;
        runButton.textContent = "Run";

        const ctx = graphicsCanvas.getContext("2d");
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, graphicsCanvas.width, graphicsCanvas.height);
        console.log("Canvas ready");
    })
    .catch(err => {
        console.error("WASM load failed:", err);
    });

    runButton.addEventListener("click", function () {
        if (!wasmReady) {
            console.log("WASM not ready");
            return;
        }
        console.log("Run:", userCode);
    });
});
