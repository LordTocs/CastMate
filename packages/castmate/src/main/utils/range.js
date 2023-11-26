export function inRange(value, range) {
	if (!range) return true

	if (range.min != null) {
		if (range.min > value) {
			return false
		}
	}
	if (range.max != null) {
		if (range.max < value) {
			return false
		}
	}
	return true
}

export function clampRange(value, range) {
	if (!range) return value

	if (range.min != null) {
		if (value < range.min) {
			return range.min
		}
	}

	if (range.max != null) {
		if (value > range.max) {
			return range.max
		}
	}

	return value
}
