import {
	Color,
	Schema,
	constructDefault,
	SchemaType,
	IPCActionDefinition,
	IPCPluginDefinition,
	mapRecord,
} from "castmate-schema"
import { ActionDefinition, defineAction } from "../queue-system/action"
import { TriggerDefinition, defineTrigger } from "../queue-system/trigger"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { EventList } from "../util/events"
import { SemanticVersion } from "../util/type-helpers"
import { reactify, reactiveRef } from "../reactivity/reactivity"

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
			icon: "mdi-pencil",
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

export function onUILoad(loadFunc: () => any) {
	if (!initingPlugin) throw new Error()

	const privates = initingPlugin as unknown as PluginPrivates
	privates.uiloader.register(loadFunc)
}

export function onLoad(loadFunc: () => Promise<any> | any) {
	if (!initingPlugin) throw new Error()

	const privates = initingPlugin as unknown as PluginPrivates
	privates.loader.register(loadFunc)
}

export function onUnload(unloadFunc: () => Promise<any> | any) {
	if (!initingPlugin) throw new Error()

	const privates = initingPlugin as unknown as PluginPrivates
	privates.unloader.register(unloadFunc)
}

interface PluginPrivates {
	loader: EventList
	unloader: EventList
	uiloader: EventList
}

interface StateObj<StateSchema extends Schema> {
	value: SchemaType<StateSchema>
}

interface StateDefinition<StateSchema extends Schema = any> {
	schema: StateSchema
	obj: StateObj<StateSchema>
}

export function defineState<T extends Schema>(id: string, schema: T) {
	if (!initingPlugin) throw new Error()

	const initial = constructDefault(schema)
	const result = reactiveRef<SchemaType<T>>(initial)

	initingPlugin.state.set(id, {
		schema,
		obj: result,
	})

	return result
}

export let initingPlugin: Plugin | null = null

export class Plugin {
	actions: Map<string, ActionDefinition> = new Map()
	triggers: Map<string, TriggerDefinition> = new Map()
	state: Map<string, StateDefinition> = new Map()

	private loader = new EventList()
	private unloader = new EventList()
	private uiloader = new EventList()

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

	async load(): Promise<boolean> {
		try {
			await this.loader.run()
		} catch (err) {
			//TODO_ERRRORS
			return false
		}
		return true
	}

	async unload(): Promise<boolean> {
		try {
			await this.unloader.run()
		} catch (err) {
			//TODO_ERRRORS
			return false
		}
		return true
	}

	async onUILoaded(): Promise<boolean> {
		try {
			await this.uiloader.run()
		} catch (err) {
			return false
		}
		return true
	}

	toIPC(): IPCPluginDefinition {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			icon: this.icon,
			color: this.color,
			version: this.version,
			actions: mapRecord(this.actions, (k, v) => v.toIPC()),
			triggers: mapRecord(this.triggers, (k, v) => v.toIPC()),
		}
	}
}
/*
definePlugin(
	{
		id: "test",
		name: "Test!",
		icon: "mdi-plus",
		color: "#ff0000",
	},
	() => {
		defineAction({
			id: "testAction",
			name: "Test Action",
			config: {
				type: Object,
				properties: {
					hello: { type: String },
				},
			},
			async invoke(config, contextData, abortSignal) {
				console.log(config.hello)
			},
		})

		const onTest = defineTrigger({
			id: "onTest",
			name: "On Test",
			context: {
				type: Object,
				properties: {
					hello: { type: Number },
				},
			},
			config: {
				type: Object,
				properties: {
					min: { type: Number, required: true, default: 0 },
				},
			},
			async handle(config, context) {
				return (context.hello ?? 0) > config.min
			},
		})

		onTest({
			hello: 10,
		})

		const renderTest = defineRendererCallable("renderTest", (yo: string) => {
			console.log(yo)
		})

		onLoad(async () => {
			renderTest("Ahoy")
		})

		onUnload(async () => {})
	}
)
*/
