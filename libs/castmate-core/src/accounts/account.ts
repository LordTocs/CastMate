import { Resource } from "../resources/resource"
export interface AccountConfig {
	name: string
	icon?: string
	scopes: string[]
}

export interface AccountState {
	authenticated: boolean
}

export interface AccountSecrets {}

export class Account<
	Secrets extends AccountSecrets = AccountSecrets,
	CustomAccountConfig extends AccountConfig = AccountConfig
> extends Resource<CustomAccountConfig, AccountState> {
	constructor() {
		super()

		this.state = { authenticated: false }
	}

	_secrets: Secrets
	get secrets(): Secrets {
		return this._secrets
	}

	async setSecrets(secrets: Secrets) {
		//Serialize here
	}

	async checkCachedCreds(): Promise<boolean> {
		return false
	}

	async refreshCreds(): Promise<boolean> {
		return false
	}

	async login(scopes: string[], abort: AbortSignal): Promise<boolean> {
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

	async init() {
		if (!(await this.checkCachedCreds())) {
			if (!(await this.refreshCreds())) {
				this.state.authenticated = false
			}
		}
		this.state.authenticated = true
	}
}
