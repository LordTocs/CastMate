import axios from "axios"
import {
	ReactiveRef,
	RetryTimer,
	abortableSleep,
	coreAxios,
	defineRendererCallable,
	onLoad,
	onSettingChanged,
	sleep,
	usePluginLogger,
} from "castmate-core"
import os from "os"

const logger = usePluginLogger("philips-hue")

export function setupDiscovery(hubIp: ReactiveRef<string | undefined>, hubKey: ReactiveRef<string | undefined>) {
	async function discoverBridge() {
		const resp = await coreAxios.get("https://discovery.meethue.com/")

		if (!Array.isArray(resp.data) || resp.data.length == 0) {
			return
		}

		hubIp.value = resp.data[0]?.internalipaddress
	}

	async function tryCreateKey() {
		if (!hubIp.value) return

		try {
			const resp = await coreAxios.post(`http://${hubIp.value}/api`, {
				devicetype: `CastMate#${os.userInfo().username}`,
			})

			const key = resp.data[0]?.success?.username as string | undefined

			if (key) {
				logger.log("Key Found", key)
				hubKey.value = key
			}

			return key
		} catch (err) {
			logger.error("Error Creating HUE Key", err)
			return undefined
		}
	}

	defineRendererCallable("findHueBridge", async () => {
		logger.log("Starting Finding a Hue Bridge")
		hubIp.value = undefined
		hubKey.value = undefined

		await discoverBridge()

		if (!hubIp.value) {
			logger.log("Unable to find Bridge Ip")
			return false
		}

		logger.log("Found Bridge Ip", hubIp.value)

		for (let i = 0; i < 6; ++i) {
			logger.log("Attempting Hub Key Creation")
			const key = await tryCreateKey()

			if (key) {
				logger.log("Key Created")
				return true
			}

			if (i != 5) {
				logger.log("Retrying...")
				await sleep(10 * 1000)
			}
		}

		return false
	})
}
