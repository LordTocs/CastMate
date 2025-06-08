import {
	IPCActionDefinition,
	isKey,
	ResolvedSchemaType,
	SchemaPaths,
	Duration,
	IPCDurationConfig,
	MaybePromise,
	mapKeys,
} from "castmate-schema"
import { AnalyticsService, ignoreReactivity, PluginManager } from "../index"
import { Color } from "castmate-schema"
import { Schema, SchemaType } from "castmate-schema"
import { initingPlugin } from "../plugins/plugin-init"
import { type Plugin } from "../plugins/plugin"
import { SemanticVersion, isArray } from "../util/type-helpers"
import { deserializeSchema, ipcConvertSchema, ipcRegisterSchema } from "../util/ipc-schema"
import { defineIPCFunc } from "../util/electron"
import { templateSchema } from "../templates/template"
import { globalLogger, usePluginLogger } from "../logging/logging"

interface ActionMetaData {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

export type ActionInvokeContextData = {
	contextState: Record<PropertyKey, any>
}

interface BaseDurationState {
	indefinite?: boolean
}

interface DurationSliderState<ConfigSchema extends Schema> extends BaseDurationState {
	min?: number
	max?: number
	sliderProp: SchemaPaths<ConfigSchema>
}

interface CropDurationState<ConfigSchema extends Schema> extends BaseDurationState {
	dragType: "crop"
	duration: number
	leftSlider?: DurationSliderState<ConfigSchema>
	rightSlider?: DurationSliderState<ConfigSchema>
}

interface FixedDurationState<ConfigSchema extends Schema> extends BaseDurationState {
	dragType: "fixed"
	duration: number
}

interface LengthDurationState<ConfigSchema extends Schema> extends BaseDurationState {
	dragType: "length"
	rightSlider: DurationSliderState<ConfigSchema>
}

interface InstantDurationState<ConfigSchema extends Schema> extends BaseDurationState {
	dragType: "instant"
}

type DurationState<ConfigSchema extends Schema> =
	| FixedDurationState<ConfigSchema>
	| LengthDurationState<ConfigSchema>
	| CropDurationState<ConfigSchema>
	| InstantDurationState<ConfigSchema>

type DurationConfig<ConfigSchema extends Schema> =
	| DurationState<ConfigSchema>
	| {
			propDependencies: SchemaPaths<ConfigSchema> | Array<SchemaPaths<ConfigSchema>>
			callback: (config: SchemaType<ConfigSchema>) => MaybePromise<DurationState<ConfigSchema>>
	  }

interface ActionDefinitionSpec<ConfigSchema extends Schema, ResultSchema extends Schema | undefined>
	extends ActionMetaData {
	config: ConfigSchema
	duration?: DurationConfig<ConfigSchema>
	result?: ResultSchema
	invoke(
		config: Readonly<ResolvedSchemaType<ConfigSchema>>,
		contextData: ActionInvokeContextData,
		abortSignal: AbortSignal
	): Promise<ResultSchema extends Schema ? ResolvedSchemaType<ResultSchema> : void>
}

interface BaseActionDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color?: Color
	load(): any
	unload(): any
	registerIPC(path: string): any
	toIPC(path: string): IPCActionDefinition
}

interface RegularActionDefinition extends BaseActionDefinition {
	type: "regular"
	readonly configSchema: Schema
	invoke(config: any, contextData: ActionInvokeContextData, abortSignal: AbortSignal): Promise<any>
	getDuration(config: any): Promise<number | undefined>
}

interface FlowActionDefinition extends BaseActionDefinition {
	type: "flow"
	readonly configSchema: Schema
	readonly flowSchema?: Schema
	invoke(
		config: any,
		flows: any,
		contextData: ActionInvokeContextData,
		abortSignal: AbortSignal
	): Promise<string | undefined>
	getDuration(config: any): Promise<number | undefined>
}

export type ActionDefinition = RegularActionDefinition | FlowActionDefinition

class ActionImplementation<ConfigSchema extends Schema, ResultSchema extends Schema | undefined>
	implements RegularActionDefinition
{
	constructor(private spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>, private plugin: Plugin) {}

	get type(): "regular" {
		return "regular"
	}

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
		return this.spec.icon
	}

	get color() {
		return this.spec.color
	}

	get version() {
		return this.spec.version
	}

	get configSchema() {
		return this.spec.config
	}

	async getDuration(config: SchemaType<ConfigSchema>) {
		if (!this.spec.duration) return undefined

		let durationState: DurationState<ConfigSchema>

		if ("callback" in this.spec.duration) {
			durationState = await this.spec.duration.callback(config)
		} else {
			durationState = this.spec.duration
		}

		if (durationState.dragType == "instant") {
			return undefined
		}
		if (durationState.dragType == "crop") {
			const left = durationState.leftSlider ? config[durationState.leftSlider.sliderProp] ?? 0 : 0
			const right = durationState.rightSlider
				? config[durationState.rightSlider.sliderProp] ?? durationState.duration
				: 0

			if (typeof left == "string") return undefined
			if (typeof right == "string") return undefined

			return right - left
		}
		if (durationState.dragType == "fixed") {
			return durationState.duration
		}
		if (durationState.dragType == "length") {
			const duration = config[durationState.rightSlider.sliderProp] ?? 0
			if (typeof duration == "string") return undefined
			return duration
		}
	}

	load() {
		// if (this.spec.durationHandler && !isKey(this.spec.durationHandler)) {
		// 	defineIPCFunc(this.plugin.id, `actions_${this.id}_durationHandler`, this.spec.durationHandler)
		// }
		if (this.spec.duration) {
			if ("callback" in this.spec.duration) {
				//console.log("SETTING UP CALLBACK", `actions_${this.id}_duration`)
				defineIPCFunc(this.plugin.id, `actions_${this.id}_duration`, async (config) => {
					const configReal = await deserializeSchema(this.configSchema, config)
					if (this.spec.duration && "callback" in this.spec.duration) {
						return this.spec.duration.callback(configReal)
					}
				})
			}
		}
	}

	unload() {}

	async invoke(config: SchemaType<ConfigSchema>, contextData: ActionInvokeContextData, abortSignal: AbortSignal) {
		if (abortSignal.aborted) return

		const templateContext = {
			...contextData.contextState,
			...PluginManager.getInstance().state,
		}

		const resolvedConfig: ResolvedSchemaType<ConfigSchema> = await templateSchema(
			config,
			this.configSchema,
			templateContext
		)

		AnalyticsService.getInstance().track("action", {
			plugin: this.plugin.id,
			action: this.id,
			data: resolvedConfig,
		})

		return await ignoreReactivity(async () => await this.spec.invoke(resolvedConfig, contextData, abortSignal))
	}

	registerIPC(path: string) {
		ipcRegisterSchema(this.spec.config, `${path}_config`)
		if (this.spec.result) {
			ipcRegisterSchema(this.spec.result, `${path}_result`)
		}
	}

	toIPC(path: string): IPCActionDefinition {
		let duration: IPCDurationConfig

		if (this.spec.duration) {
			if ("callback" in this.spec.duration) {
				let propDependencies: string[] = []
				if (this.spec.duration.propDependencies) {
					if (isArray(this.spec.duration.propDependencies)) {
						propDependencies = this.spec.duration.propDependencies
					} else {
						propDependencies = [this.spec.duration.propDependencies]
					}
				}
				duration = { ipcCallback: `${this.plugin.id}_actions_${this.id}_duration`, propDependencies }
			} else {
				duration = {
					...this.spec.duration,
				}
			}
		} else {
			duration = { dragType: "instant" }
		}

		return {
			type: "regular",
			id: this.id,
			name: this.name,
			description: this.description,
			icon: this.icon,
			color: this.color,
			duration,
			config: ipcConvertSchema(this.spec.config, `${path}_config`),
			result: this.spec.result ? ipcConvertSchema(this.spec.result, `${path}_result`) : undefined,
		}
	}
}

export function defineAction<ConfigSchema extends Schema, ResultSchema extends Schema | undefined>(
	spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>
) {
	if (!initingPlugin) {
		throw new Error("Can only be used while initing a plugin")
	}

	const logger = usePluginLogger()

	logger.log("Defining Action", spec.id)
	const impl = new ActionImplementation<ConfigSchema, ResultSchema>(
		{
			icon: "mdi mdi-pencil",
			color: initingPlugin.color,
			version: "0.0.0",
			...spec,
		},
		initingPlugin
	)

	initingPlugin.actions.set(impl.id, impl)

	return impl
}

interface Flows<FlowSchema extends Schema> {
	[id: string]: SchemaType<FlowSchema>
}

interface ResolvedFlows<FlowSchema extends Schema> {
	[id: string]: ResolvedSchemaType<FlowSchema>
}

class FlowActionImplementation<ConfigSchema extends Schema, FlowSchema extends Schema> implements FlowActionDefinition {
	constructor(private spec: FlowActionSpec<ConfigSchema, FlowSchema>, private plugin: Plugin) {}

	get type(): "flow" {
		return "flow"
	}

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
		return this.spec.icon
	}

	get color() {
		return this.spec.color
	}

	get version() {
		return this.spec.version
	}

	get configSchema() {
		return this.spec.config
	}

	get flowSchema() {
		return this.spec.flowConfig
	}

	load() {}

	unload() {}

	registerIPC(path: string) {
		ipcRegisterSchema(this.spec.config, `${path}_config`)
		if (this.spec.flowConfig) {
			ipcRegisterSchema(this.spec.flowConfig, `${path}_flowConfig`)
		}
	}

	toIPC(path: string): IPCActionDefinition {
		return {
			type: "flow",
			id: this.id,
			name: this.name,
			description: this.description,
			icon: this.icon,
			color: this.color,
			config: ipcConvertSchema(this.spec.config, `${path}_config`),
			...(this.spec.flowConfig
				? { flowConfig: ipcConvertSchema(this.spec.flowConfig, `${path}_flowConfig`) }
				: {}),
		}
	}

	async invoke(
		config: SchemaType<ConfigSchema>,
		flows: Flows<FlowSchema>,
		contextData: ActionInvokeContextData,
		abortSignal: AbortSignal
	): Promise<string | undefined> {
		const templateContext = {
			...contextData.contextState,
			...PluginManager.getInstance().state,
		}

		const resolveConfig: ResolvedSchemaType<ConfigSchema> = await templateSchema(
			config,
			this.configSchema,
			templateContext
		)

		//globalLogger.log("Flow Invoke", flows)

		const resolvedFlows: ResolvedFlows<FlowSchema> = {}
		await Promise.allSettled(
			Object.keys(flows).map(async (k) => {
				resolvedFlows[k] = await templateSchema(flows[k], this.flowSchema, templateContext)
			})
		)

		//globalLogger.log("Resolved Flow Invoke", resolvedFlows)

		return await this.spec.invoke(resolveConfig, resolvedFlows, contextData, abortSignal)
	}

	async getDuration(config: any) {
		return undefined
	}
}

interface FlowActionSpec<ConfigSchema extends Schema, FlowSchema extends Schema> extends ActionMetaData {
	config: ConfigSchema
	flowConfig: FlowSchema
	invoke(
		config: Readonly<ResolvedSchemaType<ConfigSchema>>,
		flows: ResolvedFlows<FlowSchema>,
		contextData: ActionInvokeContextData,
		abortSignal: AbortSignal
	): Promise<string | undefined>
}

export function defineFlowAction<ConfigSchema extends Schema, FlowSchema extends Schema>(
	spec: FlowActionSpec<ConfigSchema, FlowSchema>
) {
	if (!initingPlugin) {
		throw new Error("Can only be used while initing a plugin")
	}

	const logger = usePluginLogger()

	logger.log("Defining Flow Action", spec.id)
	const impl = new FlowActionImplementation<ConfigSchema, FlowSchema>(
		{
			icon: "mdi mdi-pencil",
			color: initingPlugin.color,
			version: "0.0.0",
			...spec,
		},
		initingPlugin
	)

	initingPlugin.actions.set(impl.id, impl)

	return impl
}
