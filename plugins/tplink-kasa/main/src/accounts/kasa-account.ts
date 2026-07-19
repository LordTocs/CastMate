import {
	Account,
	definePluginResource,
	defineResourceSetting,
	GenericLoginService,
	ResourceStorage,
	usePluginLogger,
} from "castmate-core"
import { KasaAccountConfig, KasaAccountSecrets } from "castmate-plugin-tplink-kasa-shared"
import assert from "node:assert"

const logger = usePluginLogger("kasa")

export class KasaAccount extends Account<KasaAccountSecrets, KasaAccountConfig> {
	static storage = new ResourceStorage<KasaAccount>("KasaAccount")
	static accountDirectory: string = "kasa"

	constructor() {
		super()
		this._secrets = {
			password: "",
		}
		this._config = {
			name: "Wyze Account",
			email: "",
			scopes: [],
		}
	}

	static get main() {
		const main = this.storage.getById("main")
		assert(main)
		return main
	}

	async checkCachedCreds(): Promise<boolean> {
		return !!this.config.email
	}

	async refreshCreds(): Promise<boolean> {
		return !!this.config.email
	}

	async login(): Promise<boolean> {
		const result = await GenericLoginService.getInstance().openLogin("Kasa Login", async (username, password) => {
			logger.log("Trying Login", username, password)
			await this.applyConfig({
				email: username,
			})
			logger.log("Applied Email")

			await this.applySecrets({
				password,
			})

			logger.log("Applied Secrets")

			return true
		})
		logger.log("Login Complete", result)

		return result
	}

	static async initialize(): Promise<void> {
		await super.initialize()

		logger.log("Inited Kasa Account")
		const main = new KasaAccount()
		main._id = "main"
		await main.load()
		await this.storage.inject(main)
	}
}

export function setupAccount() {
	definePluginResource(KasaAccount)

	defineResourceSetting(KasaAccount, "KasaAccount")
}
