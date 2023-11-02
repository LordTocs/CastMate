import axios from "axios"
import { ReactiveRef, RetryTimer, defineRendererCallable, onLoad, onSettingChanged } from "castmate-core"
import os from "os"

export function setupDiscovery(hubIp: ReactiveRef<string | undefined>, hubKey: ReactiveRef<string | undefined>) {
	async function discoverBridge() {
		const resp = await axios.get("https://discovery.meethue.com/")

		if (!Array.isArray(resp.data) || resp.data.length == 0) {
			return
		}

		hubIp.value = resp.data[0]?.internalAddress
	}

	async function tryCreateKey() {
		if (!hubIp.value) return

		const resp = await axios.post(`http://${hubIp.value}/api`, {
			devicetype: `CastMate#${os.userInfo().username}`,
		})

		const key = resp.data[0]?.success?.username as string | undefined

		if (key) {
			hubKey.value = key
		}

		return key
	}

	defineRendererCallable("findHueBridge", async () => {
		hubIp.value = undefined
		hubKey.value = undefined

		await discoverBridge()

		for (let i = 0; i < 6; ++i) {
			const key = await tryCreateKey()

			if (key) {
				return
			}
		}
	})
}
