import { ensureDirectory, loadSecretYAML, resolveProjectPath, writeSecretYAML } from "../io/file-system"
import { Resource } from "../resources/resource"
import { ResourceRegistry } from "../resources/resource-registry"
import { EventList } from "../util/events"

import { AccountConfig, AccountSecrets, AccountState } from "castmate-schema"

interface AccountContructor {
	new (...args: any[]): any
	accountDirectory: string
}

export class Account<
	Secrets extends AccountSecrets = AccountSecrets,
	CustomAccountConfig extends AccountConfig = AccountConfig
> extends Resource<CustomAccountConfig, AccountState> {
	static accountDirectory: string = ""

	constructor() {
		super()

		this.state = { authenticated: false }
	}

	_secrets: Secrets
	get secrets(): Secrets {
		return this._secrets
	}

	/**
	 * Used to limit what part of the secrets is saved to file
	 */
	protected get savedSecrets() {
		return this._secrets
	}

	protected async saveSecrets() {
		const accountDir = (this.constructor as AccountContructor).accountDirectory
		await writeSecretYAML(this.savedSecrets, "accounts", accountDir, `${this.id}.syaml`)
	}

	protected async loadSecrets() {
		const accountDir = (this.constructor as AccountContructor).accountDirectory
		try {
			this._secrets = await loadSecretYAML("accounts", accountDir, `${this.id}.syaml`)
		} catch (err) {
			this._secrets = {} as Secrets
		}
	}

	async setSecrets(secrets: Secrets) {
		this._secrets = secrets
		this.saveSecrets()
		this.onSecretsChanged.run()
	}

	async checkCachedCreds(): Promise<boolean> {
		return false
	}

	async refreshCreds(): Promise<boolean> {
		return false
	}

	async login(): Promise<boolean> {
		return false
	}

	hasScope(scope: string | string[]) {
		if (Array.isArray(scope)) {
			for (let s of scope) {
				if (!this.config.scopes.includes(s)) return false
			}
			return true
		} else {
			return this.config.scopes.includes(scope)
		}
	}

	static async initialize() {
		super.initialize()
		await ensureDirectory(resolveProjectPath("accounts", this.accountDirectory))

		//@ts-ignore It will, that's how inheritence works...
		ResourceRegistry.getInstance().exposeIPCFunction(this, "login")
	}

	async load() {
		await this.loadSecrets()
		if (!(await this.checkCachedCreds())) {
			if (!(await this.refreshCreds())) {
				this.state.authenticated = false
			}
		}
		this.state.authenticated = true
	}

	readonly onSecretsChanged = new EventList()
}
