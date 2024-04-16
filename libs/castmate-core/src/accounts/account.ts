import { ensureDirectory, loadSecretYAML, resolveProjectPath, writeSecretYAML } from "../io/file-system"
import { onLoad, onUnload } from "../plugins/plugin"
import { Resource, ResourceBase, ResourceConstructor, ResourceStorage } from "../resources/resource"
import { ResourceRegistry } from "../resources/resource-registry"
import { EventList } from "../util/events"
import util, { InspectOptions } from "util"

import { AccountConfig, AccountSecrets, AccountState } from "castmate-schema"

interface AccountConstructor extends ResourceConstructor {
	new (...args: any[]): any
	accountDirectory: string
	storage: ResourceStorage<Account>
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
		const accountDir = (this.constructor as AccountConstructor).accountDirectory
		await writeSecretYAML(this.savedSecrets, "accounts", accountDir, `${this.id}.syaml`)
	}

	protected async loadSecrets() {
		const accountDir = (this.constructor as AccountConstructor).accountDirectory
		try {
			this._secrets = await loadSecretYAML("accounts", accountDir, `${this.id}.syaml`)
		} catch (err) {
			this._secrets = {} as Secrets
		}
	}

	async setSecrets(secrets: Secrets) {
		this._secrets = secrets
		this.saveSecrets()
	}

	async applySecrets(secrets: Partial<Secrets>) {
		Object.assign(this._secrets, secrets)
		this.saveSecrets()
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

	protected async finishAuth() {
		this.state.authenticated = true
		await this.onAuthorized.run()
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
		await super.initialize()
		await ensureDirectory(resolveProjectPath("accounts", this.accountDirectory))

		//@ts-ignore It will, that's how inheritence works...
		ResourceRegistry.getInstance().exposeIPCFunction(this, "login")
	}

	async load() {
		await this.loadSecrets()
		if (!(await this.checkCachedCreds())) {
			if (!(await this.refreshCreds())) {
				this.state.authenticated = false
				return
			}
		}
		this.state.authenticated = true
	}

	get isAuthenticated() {
		return this.state.authenticated
	}

	readonly onAuthorized = new EventList();

	[util.inspect.custom](depth: number, options: InspectOptions, inspect: (obj: any) => string): string {
		return `[Account ${this.constructor.name}: ${this.id}]`
	}
}

export function onAccountAuth<AccountType extends AccountConstructor>(
	accountType: AccountType,
	id: string,
	func: (account: InstanceType<AccountType>) => any
) {
	const funcHarness = () => func(accountType.storage.getById(id) as InstanceType<AccountType>)

	onLoad(() => {
		const account = accountType.storage.getById(id)
		account?.onAuthorized?.register(funcHarness)

		if (account?.isAuthenticated) {
			funcHarness()
		}
	})

	onUnload(() => {
		const account = accountType.storage.getById(id)
		account?.onAuthorized?.unregister(funcHarness)
	})
}
