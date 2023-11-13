import { ResolvedSchemaType } from "./../../../castmate-schema/src/schema"
import { Profile } from "./../profile/profile"
import {
	Color,
	Schema,
	constructDefault,
	SchemaType,
	IPCActionDefinition,
	IPCPluginDefinition,
	mapRecord,
	IPCSettingsDefinition,
	IPCStateDefinition,
} from "castmate-schema"
import { ActionDefinition, defineAction } from "../queue-system/action"
import { TriggerDefinition, defineTrigger } from "../queue-system/trigger"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { EventList } from "../util/events"
import { SemanticVersion } from "../util/type-helpers"
import { ReactiveEffect, ReactiveRef, reactiveComputed, reactiveRef, runOnChange } from "../reactivity/reactivity"
import { ensureYAML, loadSecretYAML, loadYAML, pathExists, writeSecretYAML, writeYAML } from "../io/file-system"
import _debounce from "lodash/debounce"
import { deserializeSchema, ipcConvertSchema, ipcRegisterSchema, serializeSchema } from "../util/ipc-schema"
import { ResourceBase, ResourceConstructor } from "../resources/resource"
import { PluginManager } from "./plugin-manager"

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
			icon: "mdi-puzzle",
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
	onLoad(async () => {
		await resourceConstructor.initialize()
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
	ref: ReactiveRef<ResolvedSchemaType<StateSchema>>
}

export function defineState<T extends Schema>(id: string, schema: T) {
	if (!initingPlugin) throw new Error()

	//Cheat a little
	const result = reactiveRef<SchemaType<T>>(undefined as unknown as SchemaType<T>)

	initingPlugin.state.set(id, {
		schema,
		ref: result,
	})

	onLoad(async (plugin) => {
		const initial = await constructDefault(schema)
		const stateDef = plugin.state.get(id)
		if (stateDef) {
			stateDef.ref.value = initial
		}

		runOnChange(
			() => result.value,
			async () => {
				rendererUpdateState(plugin.id, id, serializeSchema(schema, result.value))
			}
		)
	})

	return result
}

export function defineReactiveState<T extends Schema>(id: string, schema: T, func: () => ResolvedSchemaType<T>) {
	if (!initingPlugin) throw new Error()

	const result = reactiveComputed<ResolvedSchemaType<T>>(func)

	initingPlugin.state.set(id, {
		schema,
		ref: result,
	})

	onLoad(async (plugin) => {
		runOnChange(
			() => result.value,
			async () => {
				rendererUpdateState(plugin.id, id, serializeSchema(schema, result.value))
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
}

type SettingDefinition = SettingValue | ResourceSetting | SecretValue | ComponentSetting

function toIPCSetting(setting: SettingDefinition, path: string): IPCSettingsDefinition {
	if (setting.type == "resource") {
		return setting
	} else if (setting.type == "value") {
		return {
			type: "value",
			schema: ipcConvertSchema(setting.schema, path),
			value: serializeSchema(setting.schema, setting.ref.value),
		}
	} else if (setting.type == "secret") {
		return {
			type: "secret",
			schema: ipcConvertSchema(setting.schema, path),
			value: serializeSchema(setting.schema, setting.ref.value),
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

function toIPCState(state: StateDefinition, path: string): IPCStateDefinition {
	//const serialized = serializeSchema(state.schema, state.ref.value)
	//console.log("Serializing", serialized, state.ref.value, typeof false, typeof serialized)
	return {
		schema: ipcConvertSchema(state.schema, path),
		value: serializeSchema(state.schema, state.ref.value),
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
				rendererUpdateSettings(plugin.id, id, serializeSchema(schema, value.value))
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
				rendererUpdateSettings(plugin.id, id, serializeSchema(schema, value.value))
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

export let initingPlugin: Plugin | null = null

export class Plugin {
	actions: Map<string, ActionDefinition> = new Map()
	triggers: Map<string, TriggerDefinition> = new Map()
	state: Map<string, StateDefinition> = new Map()
	settings: Map<string, SettingDefinition> = new Map()

	private loader = new EventList<PluginCallback>()
	private unloader = new EventList<PluginCallback>()
	private uiloader = new EventList<PluginCallback>()
	private profilesChanged = new EventList<ProfilesChangedCallback>()

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
		initingPlugin = this
		initer()
		initingPlugin = null
	}

	private async writeSettings() {
		const data: Record<string, any> = {}
		for (const [sid, setting] of this.settings) {
			if (setting.type != "value") continue
			data[sid] = serializeSchema(setting.schema, setting.ref.value)
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
		setting.ref.value = deserializeSchema(setting.schema, serializedValue)
	}

	private writeSettingsDebounced = _debounce(() => this.writeSettings(), 100)
	triggerSettingsUpdate() {
		this.writeSettingsDebounced()
	}

	private async writeSecrets() {
		const data: Record<string, any> = {}
		for (const [sid, setting] of this.settings) {
			if (setting.type != "secret") continue
			data[sid] = serializeSchema(setting.schema, setting.ref.value)
		}
		await writeSecretYAML(data, "secrets", `${this.id}.yaml`)
	}

	private serializedSecretData: Record<string, any> = {}
	private async loadSecrets() {
		if (!(await pathExists("secrets", `${this.id}.yaml`))) {
			await this.writeSecrets()
		}

		this.serializedSecretData = await loadSecretYAML("secrets", `${this.id}.yaml`)
	}

	async finishLoadingSecret(id: string) {
		const setting = this.settings.get(id)
		if (setting?.type != "secret") return
		if (!(id in this.serializedSecretData)) return
		console.log("Deserializing", id)
		setting.ref.value = deserializeSchema(setting.schema, this.serializedSecretData[id])
	}

	private writeSecretsDebounced = _debounce(() => this.writeSecrets(), 100)
	triggerSecretsUpdate() {
		this.writeSecretsDebounced()
	}

	async load(): Promise<boolean> {
		try {
			await this.loadSettings()
			await this.loadSecrets()

			await this.loader.run(this)

			for (const action of this.actions.values()) {
				await action.load()
			}

			this.serializedSettingsData = {} //Toss out our serialized data we don't need it anymore

			this.registerIPC()
		} catch (err) {
			//TODO_ERRRORS
			console.error("Error Loading", this.id)
			console.error(err)
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

	toIPC(): IPCPluginDefinition {
		const result: IPCPluginDefinition = {
			id: this.id,
			name: this.name,
			description: this.description,
			icon: this.icon,
			color: this.color,
			version: this.version,
			actions: mapRecord(this.actions, (k, v) => v.toIPC(`${this.id}_actions_${k}`)),
			triggers: mapRecord(this.triggers, (k, v) => v.toIPC(`${this.id}_triggers_${k}`)),
			settings: mapRecord(this.settings, (k, v) => toIPCSetting(v, `${this.id}_settings_${k}`)),
			state: mapRecord(this.state, (k, v) => toIPCState(v, `${this.id}_state_${k}`)),
		}
		return result
	}
}
