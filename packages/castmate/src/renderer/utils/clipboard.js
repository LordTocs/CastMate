import { clipboard } from "electron"

export function useElectronClipboard() {
	return {
		setData(obj) {
			if (obj == undefined) return
			clipboard.writeText(JSON.stringify(obj, null, 4))
		},
		getData() {
			try {
				const text = clipboard.readText()
				return JSON.parse(text)
			} catch (err) {
				return null
			}
		},
	}
}
