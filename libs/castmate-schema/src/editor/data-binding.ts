export function parseDataPath(path: string) {
	return path.split(/\.|\[|\]\.?/i).filter((v) => v.length > 0)
}
