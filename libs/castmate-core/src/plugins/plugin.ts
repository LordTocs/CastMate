import { initingPlugin, setInitingPlugin } from "./plugin-init"
import { ExposedSchemaType, ResolvedSchemaType } from "castmate-schema"
import { Profile } from "./../profile/profile"
import {
	Color,
	Schema,
	constructDefault,
	SchemaType,
	IPCActionDefinition,
	IPCPluginDefinition,
	mapRecord,
	awaitKeys,
	IPCSettingsDefinition,
	IPCStateDefinition,
} from "castmate-schema"
import { ActionDefinition, defineAction } from "../queue-system/action"
import { TriggerDefinition, defineTrigger } from "../queue-system/trigger"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { EventList } from "../util/events"
import { SemanticVersion } from "../util/type-helpers"
import {
	ReactiveEffect,
	ReactiveRef,
	aliasReactiveValue,
	reactify,
	reactiveComputed,
	reactiveRef,
	runOnChange,
} from "../reactivity/reactivity"
import { ensureYAML, loadSecretYAML, loadYAML, pathExists, writeSecretYAML, writeYAML } from "../io/file-system"
import _debounce from "lodash/debounce"
import {
	deserializeSchema,
	exposeSchema,
	ipcConvertSchema,
	ipcRegisterSchema,
	serializeSchema,
	unexposeSchema,
} from "../util/ipc-schema"
import { ResourceBase, ResourceConstructor } from "../resources/resource"
import { PluginManager } from "./plugin-manager"
import { Logger, globalLogger, usePluginLogger } from "../logging/logging"
import { startPerfTime } from "../util/time-utils"

interface PluginSpec {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

export function definePlugin(spec: PluginSpec, initter: () => void) {
	return new Plugin(
		{
			icon: "mdi mdi-puzzle",
			color: "#fefefe",
			version: "0.0.0",
			...spec,
		},
		initter
	)
}

interface SatellitePluginSpec {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

export function defineSatellitePlugin(spec: SatellitePluginSpec, initter: () => void) {
	return new Plugin(
		{
			icon: "mdi mdi-puzzle",
			color: "#fefefe",
			version: "0.0.0",
			...spec,
		},
		initter
	)
}

export function defineRendererCallable<T extends (...args: any[]) => any>(name: string, func: T) {
	if (!initingPlugin) throw new Error()

	return defineIPCFunc(initingPlugin.id, name, func)
}

export function defineRendererInvoker<T extends (...args: any[]) => void>(name: string) {
	if (!initingPlugin) throw new Error()

	return defineCallableIPC<T>(initingPlugin.id, name)
}

export function onUILoad(loadFunc: PluginCallback) {
	if (!initingPlugin) throw new Error()

	const privates = initingPlugin as unknown as PluginPrivates
	privates.uiloader.register(loadFunc)
}

type PluginCallback = ((plugin: Plugin) => any) | (() => any)
export function onLoad(loadFunc: PluginCallback) {
	if (!initingPlugin) throw new Error()

	const privates = initingPlugin as unknown as PluginPrivates
	privates.loader.register(loadFunc)
}

export function onUnload(unloadFunc: PluginCallback) {
	if (!initingPlugin) throw new Error()

	const privates = initingPlugin as unknown as PluginPrivates
	privates.unloader.register(unloadFunc)
}

export function definePluginResource(resourceConstructor: ResourceConstructor) {
	const logger = usePluginLogger()

	onLoad(async () => {
		const perf = startPerfTime(`Initing ${resourceConstructor.storage.name}`)
		try {
			await resourceConstructor.initialize()
		} finally {
			perf.stop(logger)
		}
	})

	onUnload(async () => {
		resourceConstructor.uninitialize()
	})
}

type ProfilesChangedCallback = (activeProfiles: Profile[], inactiveProfiles: Profile[]) => any
export function onProfilesChanged(profilesChanged: ProfilesChangedCallback) {
	if (!initingPlugin) throw new Error()

	const privates = initingPlugin as unknown as PluginPrivates
	privates.profilesChanged.register(profilesChanged)
}

interface PluginPrivates {
	loader: EventList<PluginCallback>
	unloader: EventList<PluginCallback>
	uiloader: EventList<PluginCallback>
	profilesChanged: EventList<ProfilesChangedCallback>
}

interface StateDefinition<StateSchema extends Schema = any> {
	schema: StateSchema
	ref: ReactiveRef<ExposedSchemaType<StateSchema>>
	updateEffect?: ReactiveEffect
	serialized: boolean
}

export function defineState<T extends Schema>(id: string, schema: T, serialized: boolean = false) {
	if (!initingPlugin) throw new Error()

	const logger = usePluginLogger()

	//Cheat a little
	const result = reactiveRef<ExposedSchemaType<T>>(undefined as unknown as ExposedSchemaType<T>)

	initingPlugin.state.set(id, {
		schema,
		ref: result,
		serialized,
	})

	onLoad(async (plugin) => {
		const initial = await constructDefault(schema)
		const stateDef = plugin.state.get(id)

		if (!stateDef) {
			logger.error("Attempted loading invalid state", id)
			return
		}

		stateDef.ref.value = initial

		if (stateDef.serialized) {
			await plugin.finishLoadingState(id)
		}

		aliasReactiveValue(stateDef.ref, "value", plugin.stateContainer, id)
		PluginManager.getInstance().injectState(plugin)

		stateDef.updateEffect = await runOnChange(
			() => result.value,
			async () => {
				const unexposed = await unexposeSchema(schema, result.value)
				const serializedData = await serializeSchema(schema, unexposed)
				rendererUpdateState(plugin.id, id, serializedData)

				if (stateDef.serialized) {
					plugin.triggerStateUpdate()
				}
			}
		)
	})

	return result
}

export function useState<T>(id: string) {
	if (!initingPlugin) throw new Error()

	const state = initingPlugin.state.get(id)
	if (!state) throw new Error()

	return state.ref as ReactiveRef<T>
}

export function defineReactiveState<T extends Schema>(id: string, schema: T, func: () => ResolvedSchemaType<T>) {
	if (!initingPlugin) throw new Error()
	const logger = usePluginLogger()

	const result = reactiveComputed<ExposedSchemaType<T>>(func)

	initingPlugin.state.set(id, {
		schema,
		ref: result,
		serialized: false,
	})

	onLoad(async (plugin) => {
		const stateDef = plugin.state.get(id)

		if (!stateDef) {
			logger.error("Attempted loading invalid state", id)
			return
		}

		aliasReactiveValue(stateDef.ref, "value", plugin.stateContainer, id)
		PluginManager.getInstance().injectState(plugin)

		stateDef.updateEffect = await runOnChange(
			() => result.value,
			async () => {
				const unexposed = await unexposeSchema(schema, result.value)
				const serialized = await serializeSchema(schema, unexposed)
				rendererUpdateState(plugin.id, id, serialized)
			}
		)
	})
}

interface SettingValue<SettingSchema extends Schema = any> {
	type: "value"
	schema: SettingSchema
	ref: ReactiveRef<SchemaType<SettingSchema>>
	saveEffect?: ReactiveEffect
}

interface SecretValue<SettingSchema extends Schema = any> {
	type: "secret"
	schema: SettingSchema
	ref: ReactiveRef<SchemaType<SettingSchema>>
	saveEffect?: ReactiveEffect
}

interface ResourceSetting {
	type: "resource"
	resourceId: string
	name: string
	description?: string
}

interface ComponentSetting {
	type: "component"
	componentId: string
}

type SettingDefinition = SettingValue | ResourceSetting | SecretValue | ComponentSetting

async function toIPCSetting(setting: SettingDefinition, path: string): Promise<IPCSettingsDefinition> {
	if (setting.type == "resource") {
		return setting
	} else if (setting.type == "value") {
		return {
			type: "value",
			schema: ipcConvertSchema(setting.schema, path),
			value: await serializeSchema(setting.schema, setting.ref.value),
		}
	} else if (setting.type == "secret") {
		return {
			type: "secret",
			schema: ipcConvertSchema(setting.schema, path),
			value: await serializeSchema(setting.schema, setting.ref.value),
		}
	} else if (setting.type == "component") {
		return setting
	}
	throw new Error()
}

function registerIPCSetting(setting: SettingDefinition, path: string) {
	if (setting.type == "value") {
		ipcRegisterSchema(setting.schema, path)
	} else if (setting.type == "secret") {
		ipcRegisterSchema(setting.schema, path)
	}
}

async function toIPCState(state: StateDefinition, path: string): Promise<IPCStateDefinition> {
	const unexposed = await unexposeSchema(state.schema, state.ref.value)

	return {
		schema: ipcConvertSchema(state.schema, path),
		value: await serializeSchema(state.schema, unexposed),
	}
}

function registerIPCState(state: StateDefinition, path: string) {
	ipcRegisterSchema(state.schema, path)
}

const rendererUpdateSettings = defineCallableIPC<(pluginId: string, settingId: string, value: any) => void>(
	"plugins",
	"updateSettings"
)

const rendererUpdateState = defineCallableIPC<(pluginId: string, stateId: string, value: any) => any>(
	"plugins",
	"updateState"
)

const rendererSetStateDef = defineCallableIPC<(pluginId: string, stateId: string, stateDef: IPCStateDefinition) => any>(
	"plugins",
	"setStateDef"
)
const rendererDeleteStateDef = defineCallableIPC<(pluginId: string, stateId: string) => any>(
	"plugins",
	"deleteStateDef"
)

export function defineSetting<T extends Schema>(id: string, schema: T) {
	if (!initingPlugin) throw new Error()

	const value = reactiveRef<SchemaType<T>>(undefined as unknown as SchemaType<T>)

	initingPlugin.settings.set(id, {
		type: "value",
		schema,
		ref: value,
	})

	onLoad(async (plugin) => {
		const initial = await constructDefault(schema)
		const setting = plugin.settings.get(id)
		if (setting?.type == "value") {
			setting.ref.value = initial
			await plugin.finishLoadingSetting(id)
		}
		//TODO: Deeeeep
		runOnChange(
			() => value.value,
			async () => {
				rendererUpdateSettings(plugin.id, id, await serializeSchema(schema, value.value))
				plugin.triggerSettingsUpdate()
			}
		)
	})

	return value
}

/**
 * Shows a particular resource in the setting
 */
export function defineResourceSetting<T extends ResourceBase>(
	resourceType: ResourceConstructor<T>,
	name: string,
	description?: string
) {
	if (!initingPlugin) throw new Error()

	initingPlugin.settings.set(resourceType.storage.name, {
		type: "resource",
		resourceId: resourceType.storage.name,
		name,
		description,
	})
}

export function defineSecret<T extends Schema>(id: string, schema: T) {
	if (!initingPlugin) throw new Error()

	const value = reactiveRef<SchemaType<T>>(undefined as unknown as SchemaType<T>)

	initingPlugin.settings.set(id, {
		type: "secret",
		schema,
		ref: value,
	})

	onLoad(async (plugin) => {
		const initial = await constructDefault(schema)
		const setting = plugin.settings.get(id)
		if (setting?.type == "secret") {
			setting.ref.value = initial
			await plugin.finishLoadingSecret(id)
		}
		//TODO: Deeeeep
		runOnChange(
			() => value.value,
			async () => {
				rendererUpdateSettings(plugin.id, id, await serializeSchema(schema, value.value))
				plugin.triggerSecretsUpdate()
			}
		)
	})

	return value
}

export function defineSettingComponent(id: string) {
	if (!initingPlugin) throw new Error()

	initingPlugin.settings.set(id, {
		type: "component",
		componentId: id,
	})
}

export function onSettingChanged<T>(ref: ReactiveRef<T> | ReactiveRef<T>[], func: () => any) {
	let effect: ReactiveEffect | undefined

	onLoad(async () => {
		effect = await runOnChange(() => {
			if (Array.isArray(ref)) {
				return ref.map((r) => r.value)
			} else {
				return ref.value
			}
		}, func)
	})

	onUnload(() => {
		effect?.dispose()
		effect = undefined
	})
}

export function getPluginSetting<T>(plugin: string, setting: string) {
	const settingDef = PluginManager.getInstance().getPlugin(plugin)?.settings?.get(setting)
	if (settingDef?.type != "value" && settingDef?.type != "secret") return undefined

	return settingDef.ref as ReactiveRef<T>
}

export class Plugin {
	actions: Map<string, ActionDefinition> = new Map()
	triggers: Map<string, TriggerDefinition> = new Map()
	state: Map<string, StateDefinition> = new Map()
	settings: Map<string, SettingDefinition> = new Map()

	private loader = new EventList<PluginCallback>()
	private unloader = new EventList<PluginCallback>()
	private uiloader = new EventList<PluginCallback>()
	private profilesChanged = new EventList<ProfilesChangedCallback>()
	stateContainer = reactify<Record<string, any>>({})
	private logger: Logger

	get id() {
		return this.spec.id
	}

	get name() {
		return this.spec.name
	}

	get description() {
		return this.spec.description
	}

	get icon() {
		return this.spec.icon ?? "mdi-puzzle"
	}

	get color() {
		return this.spec.color ?? "#efefef"
	}

	get version() {
		return this.spec.version ?? "0.0.0"
	}

	constructor(private spec: PluginSpec, initer: () => void) {
		setInitingPlugin(this)
		this.logger = usePluginLogger(spec.id)
		initer()
		setInitingPlugin(null)
	}

	private async writeSettings() {
		const data: Record<string, any> = {}
		for (const [sid, setting] of this.settings) {
			if (setting.type != "value") continue
			data[sid] = await serializeSchema(setting.schema, setting.ref.value)
		}
		await writeYAML(data, "settings", `${this.id}.yaml`)
	}

	//Load but don't deserialize our settings data
	private serializedSettingsData: Record<string, any> = {}
	private async loadSettings() {
		if (!(await pathExists("settings", `${this.id}.yaml`))) {
			await this.writeSettings()
		}

		this.serializedSettingsData = await loadYAML("settings", `${this.id}.yaml`)

		//Don't deserialize into the refs here, it will be handled in the onLoads() of each defineSetting()
		//This makes sure that deserialization happens in the order of use of resources and other items.
	}

	async finishLoadingSetting(id: string) {
		const setting = this.settings.get(id)
		if (setting?.type != "value") return
		if (!(id in this.serializedSettingsData)) return
		const serializedValue = this.serializedSettingsData[id]
		setting.ref.value = await deserializeSchema(setting.schema, serializedValue)
	}

	private writeSettingsDebounced = _debounce(() => this.writeSettings(), 100)
	triggerSettingsUpdate() {
		this.writeSettingsDebounced()
	}

	private async writeSecrets() {
		const data: Record<string, any> = {}
		for (const [sid, setting] of this.settings) {
			if (setting.type != "secret") continue
			data[sid] = await serializeSchema(setting.schema, setting.ref.value)
		}
		await writeSecretYAML(data, "secrets", `${this.id}.yaml`)
	}

	private serializedSecretData: Record<string, any> = {}
	private async loadSecrets() {
		if (!(await pathExists("secrets", `${this.id}.yaml`))) {
			await this.writeSecrets()
		}

		try {
			this.serializedSecretData = await loadSecretYAML("secrets", `${this.id}.yaml`)
		} catch (err) {
			this.logger.error(`Failed to load secrets for ${this.id}`)
			this.serializedSecretData = {}
		}
	}

	async finishLoadingSecret(id: string) {
		const setting = this.settings.get(id)
		if (setting?.type != "secret") return
		if (!(id in this.serializedSecretData)) return
		setting.ref.value = await deserializeSchema(setting.schema, this.serializedSecretData[id])
	}

	private writeSecretsDebounced = _debounce(() => this.writeSecrets(), 100)
	triggerSecretsUpdate() {
		this.writeSecretsDebounced()
	}

	////

	private serializedStateData: Record<string, any> = {}
	private async loadState() {
		if (!(await pathExists("state", `${this.id}.yaml`))) {
			await this.writeState()
		} else {
			try {
				this.serializedStateData = await loadYAML("state", `${this.id}.yaml`)
			} catch (err) {
				this.logger.error(`Failed to load state for ${this.id}`)
				this.serializedStateData = {}
			}
		}
	}

	private async writeState() {
		const data: Record<string, any> = {}
		for (const [sid, stateDef] of this.state) {
			if (!stateDef.serialized) continue

			const unexposed = await unexposeSchema(stateDef.schema, stateDef.ref.value)
			const serialized = await serializeSchema(stateDef.schema, unexposed)
			data[sid] = serialized
		}

		if (Object.keys(data).length > 0) {
			await writeYAML(data, "state", `${this.id}.yaml`)
		}
	}

	private writeStateDebounced = _debounce(() => this.writeState(), 100)
	triggerStateUpdate() {
		this.writeStateDebounced()
	}

	async finishLoadingState(id: string) {
		const state = this.state.get(id)
		if (!state?.serialized) return
		if (!(id in this.serializedStateData)) return

		const deserialized = await deserializeSchema(state.schema, this.serializedStateData[id])
		const exposed = await exposeSchema(state.schema, deserialized)
		state.ref.value = exposed
	}

	async load(): Promise<boolean> {
		try {
			await this.loadSettings()
			await this.loadSecrets()
			await this.loadState()

			await this.loader.run(this)

			for (const action of this.actions.values()) {
				await action.load()
			}

			this.serializedSettingsData = {} //Toss out our serialized data we don't need it anymore
			this.serializedSecretData = {}
			this.serializedStateData = {}

			this.registerIPC()
		} catch (err) {
			//TODO_ERRRORS
			this.logger.error("Error Loading", this.id)
			this.logger.error(err)
			return false
		}
		return true
	}

	async unload(): Promise<boolean> {
		try {
			await this.unloader.run(this)

			for (const action of this.actions.values()) {
				await action.unload()
			}
		} catch (err) {
			//TODO_ERRRORS
			return false
		}
		return true
	}

	async onUILoaded(): Promise<boolean> {
		try {
			await this.uiloader.run(this)
		} catch (err) {
			return false
		}
		return true
	}

	async onProfilesChanged(activeProfiles: Profile[], inactiveProfiles: Profile[]) {
		await this.profilesChanged.run(activeProfiles, inactiveProfiles)
	}

	registerIPC() {
		mapRecord(this.actions, (k, v) => v.registerIPC(`${this.id}_actions_${k}`))
		mapRecord(this.triggers, (k, v) => v.registerIPC(`${this.id}_triggers_${k}`))
		mapRecord(this.settings, (k, v) => registerIPCSetting(v, `${this.id}_settings_${k}`))
		mapRecord(this.state, (k, v) => registerIPCState(v, `${this.id}_state_${k}`))
	}

	async toIPC(): Promise<IPCPluginDefinition> {
		const result: IPCPluginDefinition = {
			id: this.id,
			name: this.name,
			description: this.description,
			icon: this.icon,
			color: this.color,
			version: this.version,
			actions: await awaitKeys(mapRecord(this.actions, (k, v) => v.toIPC(`${this.id}_actions_${k}`))),
			triggers: await awaitKeys(mapRecord(this.triggers, (k, v) => v.toIPC(`${this.id}_triggers_${k}`))),
			settings: await awaitKeys(mapRecord(this.settings, (k, v) => toIPCSetting(v, `${this.id}_settings_${k}`))),
			state: await awaitKeys(mapRecord(this.state, (k, v) => toIPCState(v, `${this.id}_state_${k}`))),
		}
		return result
	}

	async dynamicAddState(id: string, schema: Schema, ref: ReactiveRef<any>) {
		const stateDef: StateDefinition = {
			schema,
			ref,
			serialized: false,
		}
		this.state.set(id, stateDef)
		aliasReactiveValue(ref, "value", this.stateContainer, id)
		PluginManager.getInstance().injectState(this)

		stateDef.updateEffect = await runOnChange(
			() => stateDef.ref.value,
			async () => {
				const unexposed = await unexposeSchema(schema, stateDef.ref.value)
				rendererUpdateState(this.id, id, await serializeSchema(schema, unexposed))
			}
		)

		//Notify UI
		rendererSetStateDef(this.id, id, await toIPCState(stateDef, `${this.id}_state_${id}`))
	}

	async dynamicRemoveState(id: string) {
		const stateDef = this.state.get(id)
		if (!stateDef) return

		stateDef.updateEffect?.dispose()

		this.state.delete(id)

		delete this.stateContainer[id]

		//Notify UI
		rendererDeleteStateDef(this.id, id)
	}
}
