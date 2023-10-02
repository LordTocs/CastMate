import {
	IPCActionDefinition,
	isKey,
	ResolvedSchemaType,
	SchemaPaths,
	Duration,
	IPCDurationConfig,
	MaybePromise,
} from "castmate-schema"
import { Color } from "castmate-schema"
import { Schema, SchemaType } from "castmate-schema"
import { type Plugin, initingPlugin } from "../plugins/plugin"
import { SemanticVersion, isArray } from "../util/type-helpers"
import { ipcConvertSchema } from "../util/ipc-schema"
import { defineIPCFunc } from "../util/electron"

interface ActionMetaData {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

type ActionInvokeContextData = Record<PropertyKey, any>

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

export interface ActionDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color?: Color
	readonly configSchema: Schema

	load(): any
	unload(): any
	invoke(config: any, contextData: ActionInvokeContextData, abortSignal: AbortSignal): Promise<any>
	toIPC(): IPCActionDefinition
}

class ActionImplementation<ConfigSchema extends Schema, ResultSchema extends Schema | undefined>
	implements ActionDefinition
{
	constructor(private spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>, private plugin: Plugin) {}

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

	load() {
		// if (this.spec.durationHandler && !isKey(this.spec.durationHandler)) {
		// 	defineIPCFunc(this.plugin.id, `actions_${this.id}_durationHandler`, this.spec.durationHandler)
		// }
		if (this.spec.duration) {
			if ("callback" in this.spec.duration) {
				//console.log("SETTING UP CALLBACK", `actions_${this.id}_duration`)
				defineIPCFunc(this.plugin.id, `actions_${this.id}_duration`, this.spec.duration.callback)
			}
		}
	}

	unload() {}

	async invoke(
		config: Readonly<SchemaType<ConfigSchema>>,
		contextData: ActionInvokeContextData,
		abortSignal: AbortSignal
	) {
		if (abortSignal.aborted) return

		return await this.spec.invoke(config, contextData, abortSignal)
	}

	toIPC(): IPCActionDefinition {
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
			id: this.id,
			name: this.name,
			description: this.description,
			icon: this.icon,
			color: this.color,
			duration,
			config: ipcConvertSchema(this.spec.config),
			result: this.spec.result ? ipcConvertSchema(this.spec.result) : undefined,
		}
	}
}

export function defineAction<ConfigSchema extends Schema, ResultSchema extends Schema | undefined>(
	spec: ActionDefinitionSpec<ConfigSchema, ResultSchema>
) {
	if (!initingPlugin) {
		throw new Error("Can only be used while initing a plugin")
	}

	console.log("Defining", spec.id)
	const impl = new ActionImplementation<ConfigSchema, ResultSchema>(
		{
			icon: "mdi-pencil",
			color: initingPlugin.color,
			version: "0.0.0",
			...spec,
		},
		initingPlugin
	)

	initingPlugin.actions.set(impl.id, impl)

	return impl
}
