export type CookieContainer = Record<string, string>

export function serializeCookie(cookies: CookieContainer) {
	return Object.entries(cookies)
		.map(([key, value], i) => {
			return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
		})
		.join(";")
}

export function parseCookie(cookie: string) {
	return cookie
		.split(";")
		.map((v) => v.split("="))
		.reduce((acc, v) => {
			const key = decodeURIComponent(v[0].trim())
			const value = decodeURIComponent(v[1].trim())
			acc[key] = value
			return acc
		}, {} as CookieContainer)
}
