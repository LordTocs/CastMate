import { Color } from "castmate-schema"
import { SemanticVersion } from "../util/type-helpers"
import { Schema, SchemaType } from "castmate-schema"
import { initingPlugin } from "../plugins/plugin"
import { ipcConvertSchema } from "../util/ipc-schema"
import { IPCTriggerDefinition } from "castmate-schema"
import { Service } from "../util/service"
import { ProfileManager } from "../profile/profile-system"
import { ActionQueue } from "./action-queue"
import { SequenceRunner } from "./sequence"

interface TriggerMetaData {
	id: string
	name: string
	description?: string
	icon?: string
	color?: Color
	version?: SemanticVersion
}

interface TriggerDefinitionSpec<ConfigSchema extends Schema, ContextDataSchema extends Schema> extends TriggerMetaData {
	config: ConfigSchema
	context: ContextDataSchema
	handle(config: SchemaType<ConfigSchema>, context: SchemaType<ContextDataSchema>): Promise<boolean>
}

export interface TriggerDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon: string
	readonly color: Color
	readonly version: string

	trigger(context: any): Promise<boolean>
	toIPC(): IPCTriggerDefinition
}

class TriggerImplementation<ConfigSchema extends Schema, ContextDataSchema extends Schema> {
	constructor(private spec: TriggerDefinitionSpec<ConfigSchema, ContextDataSchema>, private _pluginId: string) {}

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

	async trigger(context: SchemaType<ContextDataSchema>) {
		const activeProfiles = ProfileManager.getInstance().activeProfiles
		let triggered = false
		//Check all the active profiles to see if they have any triggers of this type
		for (const profile of activeProfiles) {
			for (const trigger of profile.config.triggers) {
				if (trigger.plugin != this.pluginId || trigger.trigger != this.id) continue

				if (await this.spec.handle(trigger.config, context)) {
					//If spec.handle returns true then this sequence should run
					triggered = true
					if (trigger.queue) {
						const queue = ActionQueue.storage.getById(trigger.queue)
						if (!queue) {
							//ERROR!
							console.error("Missing Queue!", queue)
							continue
						}

						console.log("Running On Queue", queue.config.name)

						queue.enqueue(
							{ type: "profile", id: profile.id, subid: trigger.id },
							context as Record<string, any>
						)
					} else {
						//This
						const runner = new SequenceRunner(trigger.sequence, context)
						runner.run()
					}
				}
			}
		}

		return triggered
	}

	toIPC(): IPCTriggerDefinition {
		const triggerDef: IPCTriggerDefinition = {
			id: this.id,
			name: this.name,
			description: this.description,
			icon: this.icon,
			color: this.color,
			version: this.version,
			config: ipcConvertSchema(this.spec.config),
			context: ipcConvertSchema(this.spec.context),
		}

		//console.log(triggerDef.config)

		return triggerDef
	}
}

export function defineTrigger<Config extends Schema, ContextData extends Schema>(
	spec: TriggerDefinitionSpec<Config, ContextData>
) {
	if (!initingPlugin) {
		throw new Error("Can only be used in definePlugin")
	}

	const pluginId = initingPlugin.id

	const impl = new TriggerImplementation<Config, ContextData>(
		{
			icon: "mdi mdi-alert-circle-outline",
			color: initingPlugin.color,
			version: "0.0.0",
			...spec,
		},
		pluginId
	)

	initingPlugin.triggers.set(impl.id, impl)

	return (context: SchemaType<ContextData>) => {
		impl.trigger(context)
	}
}
