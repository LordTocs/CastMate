import { IoTProvider, Plug } from "../iot/iot-manager"
import Wyze from "wyze-node"
import { reactify } from "../state/reactive"
import moment from "moment"
import axios from "axios"
import md5 from "md5"
import logger from "../utils/logger"

const LIGHT_PRODUCT_TYPES = ["MeshLight"]
const PLUG_PRODUCT_TYPES = ["Plug"]

// Borrowed from wyze-node

const WYZE_API_KEY = "WMXHYf79Nr5gIlt3r0r7p9Tcw5bvs6BB4U8O8nGJ"
const WYZE_AUTH_URL = "https://auth-prod.api.wyze.com"
const WYZE_API_URL = "https://api.wyzecam.com:8443"
const WYZE_USER_AGENT = "wyze_ios_2.21.35"
const WYZE_PHONE_ID = "bc151f39-787b-4871-be27-5a20fd0a1937"
const WYZE_APP_VERSION = "com.hualai.WyzeCam___2.3.69"
const WYZE_SC = "9f275790cab94a72bd206c8876429f3c"
const WYZE_SV = "9d74946e652647e9b6c9d59326aef104"

function getProp(propList, propName) {
	return propList.find((i) => i.pid === propName)
}

class WyzeApi {
	constructor(pluginObj) {
		this.pluginObj = pluginObj
	}

	get username() {
		return this.pluginObj.settings.username
	}

	get password() {
		return this.pluginObj.secrets.password
	}

	async clearTokens() {
		await this.pluginObj.wyzeAuthCache.set({})
	}

	async getTokens() {
		return (await this.pluginObj.wyzeAuthCache.get()) ?? {}
	}

	async setTokens(newTokens) {
		await this.pluginObj.wyzeAuthCache.set(newTokens)
	}

	_formatRequestBody(moreData) {
		return {
			phone_id: WYZE_PHONE_ID,
			app_ver: WYZE_APP_VERSION,
			sc: WYZE_SC,
			sv: WYZE_SV,
			ts: moment().unix(),
			...moreData,
		}
	}

	async login() {
		try {
			logger.info("Doing Wyze Login")
			const result = await axios.post(
				`${WYZE_AUTH_URL}/user/login`,
				this._formatRequestBody({
					email: this.username,
					password: md5(md5(md5(this.password))),
				}),
				{
					headers: {
						"x-api-key": WYZE_API_KEY,
						"user-agent": WYZE_USER_AGENT,
						"phone-id": WYZE_PHONE_ID,
					},
				}
			)

			const { access_token: accessToken, refresh_token: refreshToken } =
				result.data

			if (!accessToken || !refreshToken) {
				logger.info("Wyze Login Failed")
				return false
			}

			await this.setTokens({
				accessToken,
				refreshToken,
			})

			return true
		} catch (err) {
			console.error("LOGIN ERR", err)
			logger.info("Wyze Login Failed")
			return false
		}
	}

	async refreshAccessToken() {
		let { refreshToken: oldRefreshToken } = await this.getTokens()

		const result = await axios.post(
			`${WYZE_API_URL}/app/user/refresh_token`,
			this._formatRequestBody({
				refresh_token: oldRefreshToken,
			})
		)

		const { access_token: accessToken, refresh_token: refreshToken } =
			result.data

		await this.setTokens({
			accessToken,
			refreshToken,
		})
	}

	async _apiRequest(path, data) {
		const { accessToken } = await this.getTokens()

		if (!accessToken) {
			if (!(await this.login())) {
				throw new Error("Unable to login")
			}
		}

		let result = await axios.post(
			`${WYZE_API_URL}${path}`,
			this._formatRequestBody({
				access_token: accessToken,
				...data,
			})
		)

		if (result.data.msg === "AccessTokenError") {
			await this.refreshAccessToken()

			const { accessToken: newAccessToken } = await this.getTokens()

			result = await axios.post(
				`${WYZE_API_URL}${path}`,
				this._formatRequestBody({
					access_token: newAccessToken,
					...data,
				})
			)

			if (result.data.msg === "AcessTokenError") {
				throw new Error("Unable to refresh access token!")
			}
		}

		return result
	}

	async _runAction(instanceId, providerKey, actionKey) {
		const result = await this._apiRequest("/app/v2/auto/run_action", {
			provider_key: providerKey,
			instance_id: instanceId,
			action_key: actionKey,
			action_params: {}, //??
			custom_string: "", //??
		})

		return result
	}

	async getDevices() {
		const result = await this._apiRequest(
			"/app/v2/home_page/get_object_list"
		)
		console.log("OBJ LIST", result.data)
		return result.data.data.device_list
	}

	async turnOff(deviceMac, deviceModel) {
		return await this._runAction(deviceMac, deviceModel, "power_off")
	}

	async turnOn(deviceMac, deviceModel) {
		return await this._runAction(deviceMac, deviceModel, "power_on")
	}

	async getDeviceInfo(deviceMac, deviceModel) {
		const result = await this._apiRequest(
			"/app/v2/device/get_device_info",
			{
				device_mac: deviceMac,
				device_model: deviceModel,
			}
		)

		return result.data.data
	}

	async getDeviceState(deviceMac, deviceModel) {
		const info = await this.getDeviceInfo(deviceMac, deviceModel)

		return {
			on: getProp(info.property_list, "P3")?.value === "1",
		}
	}
}

class WyzePlug extends Plug {
	constructor(wyzeDevice, wyze) {
		super()

		this.id = "wyze." + wyzeDevice.mac
		this.mac = wyzeDevice.mac
		this.model = wyzeDevice.product_model

		this.wyze = wyze

		this.config = {
			name: wyzeDevice.nickname,
			plugin: "wyze",
			type: "plug",
		}

		this.state = reactify({
			on: wyzeDevice.device_params.switch_state == 1,
		})
	}

	async setPlugState(on) {
		if (on === "toggle") {
			const { on: currentOn } = await this.wyze.getDeviceState(
				this.mac,
				this.model
			)
			on = !currentOn
		}

		if (on) {
			await this.wyze.turnOn(this.mac, this.model)
		} else {
			await this.wyze.turnOff(this.mac, this.model)
		}
	}
}

class WyzeIotProvider extends IoTProvider {
	constructor(pluginObj) {
		super("wyze")

		this.pluginObj = pluginObj
		this.wyze = new WyzeApi(this.pluginObj)
	}

	async relog() {
		await this.clearResources()

		await this.wyze.clearTokens()

		if (await this.wyze.login()) {
			await this.refreshDevices()
		}
	}

	async refreshDevices() {
		try {
			const devices = await this.wyze.getDevices()

			for (let device of devices) {
				if (PLUG_PRODUCT_TYPES.includes(device.product_type)) {
					//PLUG
					console.log("Plug!", device)
					const plug = new WyzePlug(device, this.wyze)
					await this._addNewPlug(plug)
				} else if (LIGHT_PRODUCT_TYPES.includes(device.product_type)) {
					//console.log("LIGHT", device)
				} else {
					console.log("UNKNOWN", device.nickname, device.product_type)
				}
			}
		} catch {
			//No auth
		}
	}

	async initServices() {
		await this.refreshDevices()
	}

	async loadPlugs() {
		return []
	}

	async loadLights() {
		return []
	}
}

export default {
	name: "wyze",
	uiName: "Wyze",
	icon: "mdi-pencil",
	color: "#3F918D",
	async init() {
		this.wyzeAuthCache = this.getCache("wyzeAuth", true)
		this.iotProvider = new WyzeIotProvider(this)
	},
	async onSecretsReload() {
		await this.wyzeAuthCache.set({})
		await this.iotProvider.relog()
	},
	async onSettingsReload() {
		await this.wyzeAuthCache.set({})
		await this.iotProvider.relog()
	},
	secrets: {
		password: {
			type: String,
			name: "Wyze Account Password",
		},
	},
	settings: {
		username: {
			type: String,
			name: "Wyze Account Username",
		},
	},
}
