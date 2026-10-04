export function joinDataPath(...paths: (string | undefined)[]) {
	let result = ""
	for (const path of paths) {
		if (!path) {
			continue
		}
		if (result.length > 0 && !path.startsWith("[")) {
			const separator = "."
			result += separator
		}
		result += path
	}

	return result
}
