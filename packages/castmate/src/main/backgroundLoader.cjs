// https://stackoverflow.com/questions/70478747/how-to-use-es-module-but-not-commonjs-with-electron-16

// Electron uses ESM, but not for files loaded via configs BECAUSE REASONS
// To work around this we use a .cjs to import the actual background ESM.

;(async function () {
	globalThis.electron = await require("electron")
	await import("./background.js")
})()
