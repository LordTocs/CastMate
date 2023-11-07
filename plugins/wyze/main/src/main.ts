import { PlugResource } from "castmate-plugin-iot-main"
import { LightResource, PollingLight } from "castmate-plugin-iot-main/src/light"
import { WyzeAccountConfig, WyzeAccountSecrets } from "castmate-plugin-wyze-shared"
import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	Account,
	ResourceStorageBase,
	ResourceStorage,
	definePluginResource,
	onAccountAuth,
	removeAllSubResource,
	defineSecret,
	getPluginSetting,
} from "castmate-core"
import axios from "axios"
import md5 from "md5"
import moment from "moment"
import { Color, Toggle } from "castmate-schema"
import { LightColor, LightConfig, PlugConfig } from "castmate-plugin-iot-shared"
import * as chromatism from "chromatism2"
import _clamp from "lodash/clamp"

const WYZE_AUTH_URL = "https://auth-prod.api.wyze.com/api/user/login"
const WYZE_API_URL = "https://api.wyzecam.com:8443"
const WYZE_USER_AGENT = "wyze_ios_2.21.35"
const WYZE_PHONE_ID = "wyze_developer_api"
const WYZE_APP_VERSION = "wyze_developer_api"
const WYZE_SC = "wyze_developer_api"
const WYZE_SV = "wyze_developer_api"

const LIGHT_PRODUCT_TYPES = ["MeshLight"]
const PLUG_PRODUCT_TYPES = ["Plug"]

const WyzeProps = {
	power: "P3",
	color: "P1507",
	brightness: "P1501",
	colorTemp: "P1502", //Kelvin [1800, 6500]
}

interface WyzeDeviceState {
	power?: boolean
	color?: string
	colorTemp?: number
	brightness?: number
}

const WyzePropsReverse: Record<string, keyof typeof WyzeProps> = {
	P3: "power",
	P1507: "color",
	P1501: "brightness",
	P1502: "colorTemp",
}

//Converts a regular javascript object into the crazy format wyze expects.
function propsToWyzeList(props: WyzeDeviceState) {
	return Object.keys(props).map((k: keyof typeof WyzeProps) => {
		const wyzePid = WyzeProps[k]
		let value = props[k]

		if (typeof value == "boolean") {
			value = value ? 1 : 0
		}

		return {
			pid: wyzePid,
			pvalue: value?.toString(),
		}
	})
}

function formatWyzeRequestBody(moreData: Record<string, any>) {
	return {
		phone_id: WYZE_PHONE_ID,
		app_ver: WYZE_APP_VERSION,
		sc: WYZE_SC,
		sv: WYZE_SV,
		ts: moment().unix(),
		...moreData,
	}
}

class WyzeAccount extends Account<WyzeAccountSecrets, WyzeAccountConfig> {
	static storage = new ResourceStorage<WyzeAccount>("WyzeAccount")
	static accountDirectory: string = "wyze"

	static get main() {
		const main = this.storage.getById("main")
		if (!main) throw new Error(`WyzeAccount resource hasn't been initialized`)
		return main
	}

	constructor() {
		super()
		this._secrets = {}
		this._config = {
			name: "",
			email: "",
			scopes: [],
		}
	}

	async checkCachedCreds() {
		return false
	}

	async refreshCreds() {
		if (!this.secrets.refreshToken) return false

		try {
			const result = await axios.post(
				`${WYZE_API_URL}/app/user/refresh_token`,
				formatWyzeRequestBody({
					refresh_token: this.secrets.refreshToken,
				})
			)

			if (!("access_token" in result.data && "refresh_token" in result.data)) return false

			const {
				access_token: accessToken,
				refresh_token: refreshToken,
			}: { access_token: string; refresh_token: string } = result.data

			await this.applySecrets({
				accessToken,
				refreshToken,
			})
		} catch (err) {
			return false
		}

		return true
	}

	private async tryLogin(email: string, password: string) {
		try {
			const keyId = getPluginSetting<string | undefined>("wyze", "keyId")
			const apiKey = getPluginSetting<string | undefined>("wyze", "apiKey")

			if (!keyId?.value || !apiKey?.value) return false

			const result = await axios.post(
				WYZE_AUTH_URL,
				{
					email,
					password: md5(md5(md5(password))),
				},
				{
					headers: {
						Keyid: keyId?.value,
						Apikey: apiKey?.value,
						"User-Agent": WYZE_USER_AGENT,
						"phone-id": WYZE_PHONE_ID,
					},
				}
			)

			if (!("access_token" in result.data && "refresh_token" in result.data)) return false

			const {
				access_token: accessToken,
				refresh_token: refreshToken,
			}: { access_token: string; refresh_token: string } = result.data

			await this.applySecrets({
				accessToken,
				refreshToken,
			})

			return true
		} catch (err) {
			return false
		}
	}

	async login() {
		return false
	}

	private async apiRequest(path: string, data: Record<string, any>) {
		if (!this.secrets.accessToken) throw new Error("Not Authenticated")
		let result = await axios.post(
			`${WYZE_API_URL}${path}`,
			formatWyzeRequestBody({
				access_token: this.secrets.accessToken,
				...data,
			})
		)

		if (result.data.msg === "AccessTokenError") {
			if (!(await this.refreshCreds())) {
				throw new Error("Not Authenticated")
			}

			result = await axios.post(
				`${WYZE_API_URL}${path}`,
				formatWyzeRequestBody({
					access_token: this.secrets.accessToken,
					...data,
				})
			)
		}

		if (result.data.msg === "AccessTokenError") {
			throw new Error("Access Token Invalid, Unable to refresh")
		}

		return result
	}

	async runAction(mac: string, model: string, actionKey: string, props?: WyzeDeviceState) {
		const data = {
			provider_key: model,
			instance_id: mac,
			action_key: actionKey,
			action_params: props
				? {
						list: [
							{
								mac,
								plist: propsToWyzeList(props),
							},
						],
				  }
				: {},
			custom_string: "",
		}

		const result = await this.apiRequest("/app/v2/auto/run_action", data)

		return result
	}

	private async getDeviceInfo(mac: string, model: string) {
		const result = await this.apiRequest("/app/v2/device/get_device_info", {
			device_mac: mac,
			device_model: model,
		})

		return result.data.data as WyzeDeviceInfo
	}

	async getDeviceState(mac: string, model: string) {
		const info = await this.getDeviceInfo(mac, model)

		const state: WyzeDeviceState = {}

		for (const prop of info.property_list) {
			const propName = WyzePropsReverse[prop.pid]
			if (propName != "color") {
				const num = Number.parseInt(prop.value)
				if (isNaN(num)) continue
				state[propName] = num as any
			} else {
				state[propName] = prop.value
			}
		}

		return state
	}

	async getDevices() {
		const result = await this.apiRequest("/app/v2/home_page/get_object_list", {})

		return (result.data.data?.device_list ?? []) as WyzeDeviceDescription[]
	}

	static async initialize(): Promise<void> {
		await super.initialize()

		const main = new WyzeAccount()
		main._id = "main"
		await main.load()
		await this.storage.inject(main)
	}
}

interface WyzeDeviceDescription {
	mac: string
	product_model: string
	product_type: string
	nickname: string
	device_params: {
		switch_state: number
	}
}

interface WyzeDeviceInfo {
	property_list: { pid: string; value: any }[]
}

interface WyzeLightConfig extends LightConfig {
	model: string
}

class WyzeLight extends LightResource<WyzeLightConfig> {
	constructor(desc: WyzeDeviceDescription) {
		super()

		this._id = `wyze.${desc.mac}`
		this._config = {
			name: desc.nickname,
			provider: "wyze",
			providerId: desc.mac,
			model: desc.product_model,
			rgb: { available: true },
			dimming: { available: true },
			kelvin: { available: true, min: 1800, max: 6500 },
			transitions: { available: false },
		}

		//@ts-ignore
		this.state = {
			on: desc.device_params.switch_state != 0,
		}
	}

	async initialize() {
		await this.updateState()
	}

	private async updateState() {
		const state = await WyzeAccount.main.getDeviceState(this.config.providerId, this.config.model)

		if (state.power != null) {
			this.state.on = state.power
		}

		if (state.colorTemp != null) {
			const bri = state.brightness ?? 100
			const kelvin = state.colorTemp
			this.state.color = `kb(${kelvin}, ${bri})`
		} else if (state.color) {
			const colorHex = state.color
			const bri = state.brightness ?? 100
			const hsv = chromatism.convert(colorHex).hsv
			this.state.color = `hsb(${hsv.h}, ${hsv.s}, ${bri})`
		}
	}

	async setLightState(color: LightColor, on: Toggle, transition: number) {
		if (on == "toggle") {
			await this.updateState()
			on = !this.state.on
		}

		const parsedColor = LightColor.parse(color)

		const stateUpdate: WyzeDeviceState = {}

		stateUpdate.power = on
		stateUpdate.brightness = parsedColor.bri
		if ("hue" in parsedColor) {
			stateUpdate.color = chromatism
				.convert({ h: parsedColor.hue, s: parsedColor.sat, v: parsedColor.bri })
				.hex.substring(1)
		} else {
			stateUpdate.colorTemp = _clamp(Math.round(parsedColor.kelvin), 2000, 6500)
		}

		await WyzeAccount.main.runAction(this.config.providerId, this.config.model, "set_mesh_property", stateUpdate)
	}
}

interface WyzePlugConfig extends PlugConfig {
	model: string
}

class WyzePlug extends PlugResource<WyzePlugConfig> {
	constructor(desc: WyzeDeviceDescription) {
		super()

		this._id = `wyze.${desc.mac}`
		this._config = {
			name: desc.nickname,
			provider: "wyze",
			providerId: desc.mac,
			model: desc.product_model,
		}
	}

	private async updateState() {
		const state = await WyzeAccount.main.getDeviceState(this.config.providerId, this.config.model)

		if (state.power != null) {
			this.state.on = state.power
		}
	}

	async setPlugState(on: Toggle) {
		await this.updateState()

		if (on == "toggle") {
			on = !this.state.on
		}

		if (on) {
			await WyzeAccount.main.runAction(this.config.providerId, this.config.model, "power_on")
		} else {
			await WyzeAccount.main.runAction(this.config.providerId, this.config.model, "power_off")
		}

		this.state.on = on
	}
}

export default definePlugin(
	{
		id: "wyze",
		name: "Wyze",
		icon: "iot iot-wyze",
		color: "#7F743F",
	},
	() => {
		const keyId = defineSecret("keyId", {
			type: String,
			name: "Wyze Key ID",
		})

		const apiKey = defineSecret("apiKey", {
			type: String,
			name: "Wyze API Key",
		})

		definePluginResource(WyzeAccount)

		async function queryDevices() {
			if (!WyzeAccount.main.state.authenticated) return
			await removeAllSubResource(WyzeAccount)

			const devices = await WyzeAccount.main.getDevices()

			const newDevices = devices.filter((d) => {
				const id = `wyze.${d.mac}`
				const light = LightResource.storage.getById(id)
				const plug = PlugResource.storage.getById(id)

				return !light && !plug
			})

			for (const newDevice of newDevices) {
				if (PLUG_PRODUCT_TYPES.includes(newDevice.product_type)) {
					const plug = new WyzePlug(newDevice)
					await PlugResource.storage.inject(plug)
				} else if (LIGHT_PRODUCT_TYPES.includes(newDevice.product_type)) {
					const light = new WyzeLight(newDevice)
					await light.initialize()
					await LightResource.storage.inject(light)
				}
			}
		}

		onAccountAuth(WyzeAccount, "main", async (account) => {
			await queryDevices()
		})
	}
)
