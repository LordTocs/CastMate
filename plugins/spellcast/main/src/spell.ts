import {
	PluginManager,
	PubSubManager,
	ReactiveEffect,
	Resource,
	ResourceStorage,
	definePluginResource,
	defineTrigger,
	ensureDirectory,
	loadYAML,
	onCloudPubSubMessage,
	onLoad,
	onProfilesChanged,
	reactiveRef,
	resolveProjectPath,
	runOnChange,
	templateSchema,
	usePluginLogger,
	useSendCloudPubSubMessage,
	writeYAML,
	ProfileManager,
	onCloudPubSubConnect,
	onCloudPubSubBeforeDisconnect,
} from "castmate-core"
import {
	SpellConfig,
	SpellConfigSchema,
	SpellResourceConfig,
	SpellResourceState,
} from "castmate-plugin-spellcast-shared"
import { nanoid } from "nanoid/non-secure"
import _debounce from "lodash/debounce"
import { onChannelAuth } from "castmate-plugin-twitch-main"
import { SpellCastSpell, SpellCastSpellData, createSpell, deleteSpell, getSpells, updateSpell } from "./api"
import fs from "fs/promises"
import path from "path"
import { TwitchViewer } from "castmate-plugin-twitch-shared"

const logger = usePluginLogger("spellcast")

interface SpellHookConstructor {
	new (...args: any): SpellHook
	resourceDirectory: string
}

function spellNeedsUpdate(current: SpellCastSpellData | undefined, desired: SpellCastSpellData) {
	if (!current) return true

	if (current.name != desired.name) return true
	if (current.description != desired.description) return true
	if (current.bits != desired.bits) return true
	if (current.color != desired.color) return true
	if (current.enabled != desired.enabled) return true

	return false
}

export class SpellHook extends Resource<SpellResourceConfig, SpellResourceState> {
	static storage = new ResourceStorage<SpellHook>("SpellHook")
	static resourceDirectory = "./spellcast/spells"

	constructor(config?: SpellConfig) {
		super()

		if (config) {
			this._id = nanoid()
			this._config = {
				spellId: "",
				name: config.name,
				spellData: {
					enabled: config.enabled,
					description: config.description,
					bits: config.bits,
					color: config.color,
				},
			}
		} else {
		}

		this.state = {
			shouldEnable: false,
		}
	}

	get directory() {
		return (this.constructor as SpellHookConstructor).resourceDirectory
	}

	get filename() {
		return `${this.id}.yaml`
	}

	get filepath() {
		return resolveProjectPath(this.directory, this.filename)
	}

	async load(config: SpellResourceConfig) {
		await super.setConfig(config)
		return true
	}
	async save() {
		await writeYAML(this.config, this.filepath)
	}

	async applyConfig(config: Partial<SpellResourceConfig>): Promise<boolean> {
		await super.applyConfig(config)
		await this.updateServer()
		await this.initializeReactivity()
		await this.save()
		return true
	}

	async setConfig(config: SpellResourceConfig): Promise<boolean> {
		await super.setConfig(config)
		await this.updateServer()
		await this.initializeReactivity()
		await this.save()
		return true
	}

	static async create(config: SpellResourceConfig) {
		const reward = new SpellHook()
		reward._id = nanoid()
		reward._config = {
			spellId: config.spellId,
			name: config.name,
			spellData: { ...config.spellData },
		}
		reward.state = {
			shouldEnable: false,
		}
		await reward.updateServer()
		await reward.initializeReactivity()
		return reward
	}

	static async onCreate(resource: SpellHook) {
		await resource.save()
	}

	static async onDelete(resource: SpellHook) {
		if (resource.config.spellId) {
			await deleteSpell(resource.config.spellId)
		}
		await fs.unlink(resource.filepath)
	}

	static getByApiId(apiId: string) {
		for (const spell of this.storage) {
			if (spell.config.spellId == apiId) return spell
		}
		return undefined
	}

	///////////////////////

	static async initialize(): Promise<void> {
		await super.initialize()

		const resolvedDir = resolveProjectPath(this.resourceDirectory)
		await ensureDirectory(resolvedDir)
		const files = await fs.readdir(resolvedDir)

		const fileLoadPromises = files.map(async (file) => {
			const id = path.basename(file, ".yaml")
			const fullFile = path.join(resolvedDir, file)

			try {
				const data = await loadYAML(fullFile)
				const resource = new this()
				resource._id = id

				if ((await resource.load(data)) === false) {
					logger.error("Load Failed", id)
					return undefined
				}

				return resource
			} catch (err) {
				logger.error("Load Errored", id, err)
				return undefined
			}
		})

		const resources = (await Promise.all(fileLoadPromises)).filter((r) => r != undefined) as SpellHook[]
		await this.storage.inject(...resources)
	}

	///////////SERVER STUFF

	/**
	 * @returns API Data corresponding to the config
	 */
	private async getApiData() {
		const resolvedData = await templateSchema(
			{
				name: this.config.name,
				...this.config.spellData,
			},
			SpellConfigSchema,
			PluginManager.getInstance().state
		)

		const apiData: SpellCastSpellData = {
			name: resolvedData.name,
			description: resolvedData.description,
			enabled: resolvedData.enabled,
			bits: resolvedData.bits,
			color: resolvedData.color,
		}

		return apiData
	}

	/**
	 * Creates a spell from an unknown remote spell
	 * @param apiData
	 * @returns
	 */
	static async recoverLocalSpell(apiData: SpellCastSpell) {
		logger.log("Recovering Spell", apiData)
		const spell = new SpellHook({
			name: apiData.name,
			enabled: apiData.enabled,
			bits: apiData.bits,
			color: apiData.color,
			description: apiData.description,
		})

		spell._config.spellId = apiData._id

		spell.state.spellData = {
			name: apiData.name,
			enabled: apiData.enabled,
			bits: apiData.bits,
			color: apiData.color,
			description: apiData.description,
		}

		await spell.save()
		await SpellHook.storage.inject(spell)

		return spell
	}

	private async updateFromApi(apiData: SpellCastSpell) {
		if (this.config.spellId != apiData._id) {
			await super.applyConfig({
				spellId: apiData._id,
			})
		}

		//logger.log("Inited Spell State", apiData.name)

		this.state.spellData = {
			name: apiData.name,
			enabled: apiData.enabled,
			bits: apiData.bits,
			color: apiData.color,
			description: apiData.description,
		}
	}

	async initializeFromServer(apiData: SpellCastSpell | undefined) {
		const expectedData = await this.getApiData()

		if (!apiData) {
			//We didn't find the equivalent of this spell on the remote server, we have to create it

			logger.log("Spell found in files but not on SpellCast servers")
			logger.log(this.config.name)

			const created = await createSpell(expectedData)

			await this.updateFromApi(created)
		} else {
			if (!spellNeedsUpdate(apiData, expectedData)) {
				await this.updateFromApi(apiData)
			} else {
				const update = await updateSpell(apiData._id, expectedData)
				await this.updateFromApi(update)
			}
		}
	}

	private reactiveEffect: ReactiveEffect<any> | undefined
	clearReactivity() {
		if (this.reactiveEffect) {
			this.reactiveEffect.dispose()
			this.reactiveEffect = undefined
		}
	}

	private updateServerDebounced = _debounce(async () => {
		await this.updateServer()
	}, 300)

	async initializeReactivity() {
		this.clearReactivity()
		this.reactiveEffect = await runOnChange(async () => await this.getApiData(), this.updateServerDebounced)
	}

	async updateServer() {
		const apiData = await this.getApiData()
		if (this.config.spellId) {
			const updated = await updateSpell(this.config.spellId, apiData)
			this.updateFromApi(updated)
		} else {
			const created = await createSpell(apiData)
			this.updateFromApi(created)
		}
	}
}

export function setupSpells() {
	definePluginResource(SpellHook)

	const hasActiveSpells = reactiveRef(false)

	const spellHook = defineTrigger({
		id: "spellHook",
		name: "SpellCast Spell",
		description: "Triggers when a viewer uses a spell through the SpellCast extension",
		icon: "sci sci-spellcast",
		config: {
			type: Object,
			properties: {
				spell: { type: SpellHook, required: true, name: "Spell" },
			},
		},
		context: {
			type: Object,
			properties: {
				spell: { type: SpellHook, required: true },
				viewer: { type: TwitchViewer, required: true },
				bits: { type: Number, required: true },
			},
		},
		async handle(config, context, mapping) {
			return config.spell == context.spell
		},
	})

	interface SpellHookEventConfig {
		buttonId: string
		user: string
		userId: string
		bits: number
	}

	onCloudPubSubMessage<SpellHookEventConfig>(
		"spellHook",
		() => hasActiveSpells.value,
		async (data) => {
			const spell = SpellHook.getByApiId(data.buttonId)

			if (!spell) {
				logger.log("Failed to find SpellHook", data.buttonId)
				return false
			}

			logger.log("Activating SpellHook", data.buttonId, spell.config.name)

			spellHook({
				spell,
				viewer: data.userId,
				bits: data.bits,
			})

			return true
		}
	)

	const setActiveSpells = useSendCloudPubSubMessage<{ spells: string[] }>("setActiveSpells")
	async function updateActiveSpells() {
		const activeSpells = new Set<string>()

		for (const profile of ProfileManager.getInstance().activeProfiles) {
			for (const trigger of profile.iterTriggers(spellHook)) {
				const localId = trigger.config.spell as unknown as string
				if (!localId) continue

				//We don't have to obey the enabled flag here, the server does that for us
				//TODO/HACK: Iter triggers doesn't deserialize from ID to Resource
				const spell = SpellHook.storage.getById(localId)

				if (!spell) continue

				const spellId = spell.config.spellId

				activeSpells.add(spellId)
			}
		}

		hasActiveSpells.value = activeSpells.size > 0

		logger.log("Active SpellCast Spells", Array.from(activeSpells))

		await setActiveSpells({ spells: Array.from(activeSpells) })
	}

	onCloudPubSubMessage<{}>(
		"reinit",
		() => hasActiveSpells.value,
		async () => {
			//Handles recovering after a server shutdown.
			await updateActiveSpells()
		}
	)

	onCloudPubSubConnect(async () => {
		await updateActiveSpells()
	})

	onCloudPubSubBeforeDisconnect(async () => {
		await setActiveSpells({ spells: [] })
	})

	onProfilesChanged(async (activeProfiles, inactiveProfiles) => {
		await updateActiveSpells()
	})

	onChannelAuth(async (channel, service) => {
		try {
			logger.log("Loading Spells from server...")
			const spells = await getSpells()

			const spellResources = [...SpellHook.storage]

			for (const spell of spellResources) {
				logger.log("Loaded Spell ", spell.id, spell.config.name, spell.config.spellId)
			}

			for (const apiSpell of spells) {
				const spell = spellResources.find((s) => s.config.spellId == apiSpell._id)

				if (!spell) {
					logger.log("No resource found for", apiSpell._id, apiSpell.name)
					await SpellHook.recoverLocalSpell(apiSpell)
				}
			}

			for (const spell of SpellHook.storage) {
				const apiSpell = spells.find((s) => s._id == spell.config.spellId)

				await spell.initializeFromServer(apiSpell)
				await spell.initializeReactivity()
			}
		} catch (err) {
			logger.error("ERROR Fetching SpellCast Spells", err)
		}
	})
}
