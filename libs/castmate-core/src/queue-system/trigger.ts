import { Color, ExposedSchemaType, ResolvedSchemaType, TriggerData } from "castmate-schema"
import { SemanticVersion } from "../util/type-helpers"
import { Schema, SchemaType } from "castmate-schema"
import { initingPlugin } from "../plugins/plugin-init"
import {
	deserializeSchema,
	exposeSchema,
	ipcConvertDynamicSchema,
	ipcConvertSchema,
	ipcRegisterDynamicSchema,
	ipcRegisterSchema,
	serializeSchema,
} from "../util/ipc-schema"
import { IPCTriggerDefinition } from "castmate-schema"
import { ProfileManager } from "../profile/profile-system"
import { ActionQueue, ActionQueueManager } from "./action-queue"
import { SequenceRunner } from "./sequence"
import { isFunction } from "lodash"
import { Profile } from "../profile/profile"
import { globalLogger, usePluginLogger } from "../logging/logging"
import { AnalyticsService } from "../analytics/analytics-manager"

const logger = usePluginLogger("triggers")

interface TriggerMetaData {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

export interface TriggerMapping {
	profileId: string
	triggerId: string
}

interface TriggerDefinitionSpec<ConfigSchema extends Schema, ContextDataSchema extends Schema> extends TriggerMetaData {
	config: ConfigSchema
	context: ContextDataSchema
	handle(
		config: SchemaType<ConfigSchema>,
		context: SchemaType<ContextDataSchema>,
		mapping: TriggerMapping
	): Promise<boolean>
}

//A transform trigger is a trigger that outputs a different context schema than it is triggered on.
//
interface TransformTriggerDefinitionSpec<
	ConfigSchema extends Schema,
	ContextDataSchema extends Schema,
	InvokeContextDataSchema extends Schema
> extends TriggerMetaData {
	config: ConfigSchema
	context: ContextDataSchema | ((config: SchemaType<ConfigSchema>) => Promise<ContextDataSchema>)
	invokeContext: InvokeContextDataSchema
	handle(
		config: SchemaType<ConfigSchema>,
		context: SchemaType<InvokeContextDataSchema>,
		mapping: TriggerMapping
	): Promise<ResolvedSchemaType<ContextDataSchema> | undefined>
}

export interface TriggerDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon: string
	readonly color: Color
	readonly version: string
	readonly config: Schema
	readonly context: Schema | ((config: any) => Promise<any>)

	trigger(context: any): Promise<boolean>
	registerIPC(path: string): any
	toIPC(path: string): IPCTriggerDefinition
}

function isTransformSpec<
	ConfigSchema extends Schema,
	ContextDataSchema extends Schema,
	InvokeContextDataSchema extends Schema
>(
	spec:
		| TriggerDefinitionSpec<ConfigSchema, InvokeContextDataSchema>
		| TransformTriggerDefinitionSpec<ConfigSchema, ContextDataSchema, InvokeContextDataSchema>
): spec is TransformTriggerDefinitionSpec<ConfigSchema, ContextDataSchema, InvokeContextDataSchema> {
	return "invokeContext" in spec
}

class TriggerImplementation<
	ConfigSchema extends Schema,
	ContextDataSchema extends Schema,
	InvokeContextDataSchema extends Schema
> implements TriggerDefinition
{
	constructor(
		private spec:
			| TriggerDefinitionSpec<ConfigSchema, InvokeContextDataSchema>
			| TransformTriggerDefinitionSpec<ConfigSchema, ContextDataSchema, InvokeContextDataSchema>,
		private _pluginId: string
	) {}

	get id() {
		return this.spec.id
	}

	get pluginId() {
		return this._pluginId
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

	get config() {
		return this.spec.config
	}

	get context() {
		return this.spec.context
	}

	get isTransform() {
		return "invokeContext" in this.spec
	}

	private async getContextSchema(configData: SchemaType<ConfigSchema>) {
		if (isFunction(this.spec.context)) {
			return await this.spec.context(configData)
		} else {
			return this.spec.context
		}
	}

	private async triggerForData(
		context: ResolvedSchemaType<InvokeContextDataSchema>,
		profile: Profile,
		trigger: TriggerData<SchemaType<ConfigSchema>>
	) {
		//First Deserialize the config for the trigger stored in the profile.
		const configValue = await deserializeSchema(this.config, trigger.config)

		//Invoke the handle function to determine if this trigger matches
		//Store our resolved config, if this is a "transform" trigger we will receive a final context to use as a return value
		let resolvedContext: ResolvedSchemaType<ContextDataSchema> | undefined
		if (isTransformSpec(this.spec)) {
			const invokeResult = await this.spec.handle(configValue, context, {
				profileId: profile.id,
				triggerId: trigger.id,
			})
			if (invokeResult != undefined) {
				resolvedContext = invokeResult
			}
		} else {
			if (await this.spec.handle(configValue, context, { profileId: profile.id, triggerId: trigger.id })) {
				resolvedContext = context as ResolvedSchemaType<ContextDataSchema> //Type system too stupid
			}
		}

		//The handle function indicated this trigger isn't a match, so don't do anything
		if (resolvedContext == null) return false

		//Get the context our resolved data is using
		ActionQueueManager.getInstance().queueOrRun("profile", profile.id, trigger.id, resolvedContext)

		return true
	}

	async trigger(context: ResolvedSchemaType<InvokeContextDataSchema>) {
		const activeProfiles = ProfileManager.getInstance().activeProfiles
		let triggered = false
		//Check all the active profiles to see if they have any triggers of this type

		for (const profile of activeProfiles) {
			for (const trigger of profile.config.triggers) {
				if (trigger.plugin != this.pluginId || trigger.trigger != this.id) continue

				try {
					if (await this.triggerForData(context, profile, trigger)) {
						triggered = true

						if (trigger.stop) {
							break
						}
					}
				} catch (err) {
					logger.error("Error Checking Trigger: ", this.pluginId, this.id)
					logger.error(err)
				}
			}
		}

		if (triggered) {
			const logger = usePluginLogger(this.pluginId)
			logger.log("Triggered", this.id, context)
			AnalyticsService.getInstance().track("trigger", {
				plugin: this.pluginId,
				trigger: this.id,
				context: context,
			})
		}

		return triggered
	}

	registerIPC(path: string) {
		ipcRegisterSchema(this.spec.config, `${path}_config`)
		ipcRegisterDynamicSchema(this.spec.context, `${path}_context`)
	}

	toIPC(path: string): IPCTriggerDefinition {
		const triggerDef: IPCTriggerDefinition = {
			id: this.id,
			name: this.name,
			description: this.description,
			icon: this.icon,
			color: this.color,
			version: this.version,
			config: ipcConvertSchema(this.spec.config, `${path}_config`),
			context: ipcConvertDynamicSchema(this.spec.context, `${path}_context`),
		}
		return triggerDef
	}
}

export interface TriggerFunc<Config extends Schema, ContextData extends Schema, InvokeContextData extends Schema> {
	(context: SchemaType<ContextData>): void
	triggerDef: TriggerImplementation<Config, ContextData, InvokeContextData>
}

export function defineTrigger<Config extends Schema, ContextData extends Schema>(
	spec: TriggerDefinitionSpec<Config, ContextData>
) {
	if (!initingPlugin) {
		throw new Error("Can only be used in definePlugin")
	}

	const pluginId = initingPlugin.id

	const impl = new TriggerImplementation<Config, ContextData, ContextData>(
		{
			icon: "mdi mdi-alert-circle-outline",
			color: initingPlugin.color,
			version: "0.0.0",
			...spec,
		},
		pluginId
	)

	initingPlugin.triggers.set(impl.id, impl)

	const triggerFunc = async (context: SchemaType<ContextData>) => {
		return await impl.trigger(context)
	}

	triggerFunc.triggerDef = impl
	return triggerFunc
}

export function defineTransformTrigger<
	Config extends Schema,
	ContextData extends Schema,
	InvokeContextData extends Schema
>(spec: TransformTriggerDefinitionSpec<Config, ContextData, InvokeContextData>) {
	if (!initingPlugin) {
		throw new Error("Can only be used in definePlugin")
	}

	const pluginId = initingPlugin.id

	const impl = new TriggerImplementation<Config, ContextData, InvokeContextData>(
		{
			icon: "mdi mdi-alert-circle-outline",
			color: initingPlugin.color,
			version: "0.0.0",
			...spec,
		},
		pluginId
	)

	initingPlugin.triggers.set(impl.id, impl)

	const triggerFunc = (context: SchemaType<InvokeContextData>) => {
		impl.trigger(context)
	}

	triggerFunc.triggerDef = impl
	return triggerFunc
}
