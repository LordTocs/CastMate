export function inRange(value, range) {
	if (range.min != undefined && range.min != null) {
		if (range.min > value) {
			return false
		}
	}
	if (range.max != undefined && range.max != null) {
		if (range.max < value) {
			return false
		}
	}
	return true
}
