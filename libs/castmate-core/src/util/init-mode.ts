export type AppMode = "castmate" | "satellite"

let mode: AppMode = "castmate"

export function setAppMode(appMode: AppMode) {
	mode = appMode
}

export function getAppMode() {
	return mode
}

export function isCastMate() {
	return mode == "castmate"
}

export function isSatellite() {
	return mode == "satellite"
}
