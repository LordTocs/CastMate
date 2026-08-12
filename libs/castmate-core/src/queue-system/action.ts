import {
	IPCActionDefinition,
	isKey,
	Duration,
	IPCDurationConfig,
	MaybePromise,
	mapKeys,
	ActionDesc,
	TSchemaProperties,
	SchemaObject,
	testActionDesc,
	ActionSpecification,
	FlowActionSpecification,
} from "castmate-schema"
import { AnalyticsService, ignoreReactivity, PluginManager } from "../index"
import { Color } from "castmate-schema"
import { Schema, SchemaType } from "castmate-schema"
import { initingPlugin } from "../plugins/plugin-init"
import { type Plugin } from "../plugins/plugin"
import { SemanticVersion, isArray } from "../util/type-helpers"
// import { deserializeSchema, ipcConvertSchema, ipcRegisterSchema } from "../util/ipc-schema"
import { defineIPCFunc } from "../util/electron"
// import { templateSchema } from "../templates/template"
import { globalLogger, usePluginLogger } from "../logging/logging"
/*
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
*/
export type ActionInvokeContextData = {
	contextState: Record<PropertyKey, any>
}

interface ActionImplDesc<
	ConfigProperties extends TSchemaProperties,
	ResultProperties extends TSchemaProperties | undefined
> {
	handle(
		config: SchemaType<SchemaObject<ConfigProperties>>
	): Promise<ResultProperties extends TSchemaProperties ? SchemaType<SchemaObject<ResultProperties>> : void>
}

export interface ActionImplementation<
	ConfigProperties extends TSchemaProperties,
	ResultProperties extends TSchemaProperties | undefined
> {
	spec: ActionSpecification<ConfigProperties, ResultProperties>
	handle(
		config: SchemaType<SchemaObject<ConfigProperties>>
	): Promise<ResultProperties extends TSchemaProperties ? SchemaType<SchemaObject<ResultProperties>> : void>
}

export function implementAction<
	ConfigProperties extends TSchemaProperties,
	ResultProperties extends TSchemaProperties | undefined
>(
	spec: ActionSpecification<ConfigProperties, ResultProperties>,
	impl: ActionImplDesc<ConfigProperties, ResultProperties>
): ActionImplementation<ConfigProperties, ResultProperties> {
	return {
		spec,
		...impl,
	}
}

implementAction(testActionDesc, {
	async handle(config) {},
})

export type FlowId = string

interface FlowActionImplDesc<
	ConfigProperties extends TSchemaProperties,
	FlowConfigProperties extends TSchemaProperties
> {
	handle(
		config: SchemaType<SchemaObject<ConfigProperties>>,
		flows: SchemaType<SchemaObject<FlowConfigProperties>>[]
	): Promise<FlowId>
}

export interface FlowActionImplementation<
	ConfigProperties extends TSchemaProperties,
	FlowConfigProperties extends TSchemaProperties
> {}

export function implementFlowAction<
	ConfigProperties extends TSchemaProperties,
	FlowConfigProperties extends TSchemaProperties
>(
	spec: FlowActionSpecification<ConfigProperties, FlowConfigProperties>,
	impl: FlowActionImplDesc<ConfigProperties, FlowConfigProperties>
): FlowActionImplementation<ConfigProperties, FlowConfigProperties> {
	return {
		spec,
		...impl,
	}
}
