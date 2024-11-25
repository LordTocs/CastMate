import {
	Account,
	GenericLoginService,
	loadYAML,
	resolveProjectPath,
	ResourceStorage,
	usePluginLogger,
} from "castmate-core"
import { BlueSkyAccountConfig, BlueSkyAccountSecrets } from "castmate-plugin-bluesky-shared"

import { CredentialSession, Agent } from "@atproto/api"
import { nanoid } from "nanoid/non-secure"

import fs from "fs/promises"
import path from "path"

const logger = usePluginLogger("bluesky")

export class BlueSkyAccount extends Account<BlueSkyAccountSecrets, BlueSkyAccountConfig> {
	static storage = new ResourceStorage<BlueSkyAccount>("BlueSkyAccount")
	static accountDirectory: string = "bluesky"

	session: CredentialSession
	agent: Agent

	get handle() {
		return this.secrets.session?.handle
	}

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this.session = new CredentialSession(new URL("https://bsky.social"), fetch, async (evt, session) => {
			if (session) {
				await this.applySecrets({ session: session })

				await this.applyConfig({
					name: session.handle,
				})
			} else {
				await this.applySecrets({ session: undefined })
			}
		})

		this._secrets = {}
		this._config = {
			name: name ?? "BlueSky Account",
			scopes: [],
		}
	}

	async checkCachedCreds() {
		try {
			if (this.secrets.session) {
				const result = await this.session.resumeSession(this.secrets.session)
				if (result.success) {
					await this.finishAuth()
					return true
				} else {
					return false
				}
			}
		} catch (err) {
			logger.error("Error checking cached creds", err)
		}
		return false
	}

	async refreshCreds() {
		//checkCachedCreds will refresh creds, and the persist handler will serialize them
		return false
	}

	private async tryLogin(identifier: string, password: string) {
		logger.log("Attempting Login w/ ", identifier)
		try {
			const creds = new CredentialSession(new URL("https://bsky.social"))

			const resp = await creds.login({
				identifier,
				password,
			})

			if (resp.success) {
				return creds.session
			} else {
				return undefined
			}
		} catch (err) {
			logger.error("BlueSky Session Error", err)
			return undefined
		}
	}

	async login() {
		logger.log("TRY LOGIN BLUESKY")
		const result = await GenericLoginService.getInstance().openLogin(
			"Blue Sky Login",
			async (username, password) => {
				const session = await this.tryLogin(username, password)

				if (session) {
					await this.session.resumeSession(session)
					await this.finishAuth()

					return true
				}

				return false
			}
		)

		return result
	}

	static async initialize(): Promise<void> {
		await super.initialize()

		const resolvedDir = resolveProjectPath("accounts", this.accountDirectory)
		let files = await fs.readdir(resolvedDir)

		files = files.filter((file) => file.endsWith(".yaml"))

		const fileLoadPromises = files.map(async (file) => {
			const id = path.basename(file, ".yaml")

			logger.log("Loading", this.storage.name, id)
			try {
				const resource = new this()
				resource._id = id

				await resource.load()

				return resource
			} catch (err) {
				logger.error("Loading Resource Threw", id, err)
				return undefined
			}
		})

		const resources = (await Promise.all(fileLoadPromises)).filter((r) => r != null) as BlueSkyAccount[]

		await this.storage.inject(...resources)
	}

	static async onDelete(resource: BlueSkyAccount) {
		const yamlFile = resolveProjectPath("accounts", this.accountDirectory, `${resource.id}.yaml`)
		const syamlFile = resolveProjectPath("accounts", this.accountDirectory, `${resource.id}.syaml`)

		await fs.unlink(yamlFile)
		await fs.unlink(syamlFile)
	}

	protected async finishAuth(): Promise<void> {
		if (this.handle) {
			this.agent = new Agent(this.session)

			const profile = await this.agent.getProfile({ actor: this.handle })

			await this.applyConfig({
				icon: profile.data.avatar,
			})
		}

		await super.finishAuth()
	}
}
