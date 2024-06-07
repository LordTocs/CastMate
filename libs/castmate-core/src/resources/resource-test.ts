import { ResolvedSchemaType, Schema, SchemaType, constructDefault } from "castmate-schema"
import { ReactiveGet, ReactiveSet } from "../reactivity/reactivity"

interface ResourceMetaData<ConfigSchema extends Schema, StateSchema extends Schema> {
	name: string
	config: ConfigSchema
	state?: StateSchema
}

interface ResourceMetaDataSpec<ConfigSchema extends Schema, StateSchema extends Schema> {
	name: string
	config: ConfigSchema
	state?: StateSchema
}

function defineResourceMetaData<ConfigSchema extends Schema, StateSchema extends Schema>(
	metaData: ResourceMetaDataSpec<ConfigSchema, StateSchema>
): ResourceMetaData<ConfigSchema, StateSchema> {
	return {
		name: metaData.name,
		config: metaData.config,
		state: metaData.state,
	}
}

interface ResourceBase2<ConfigType, StateType> {
	id: string
	readonly config: ConfigType
	readonly state: StateType
}

type ResourceConfig<T extends ResourceMetaData<any, any>> = T extends ResourceMetaData<infer S, any> ? S : never
type ResourceConfigType<T extends ResourceMetaData<any, any>> = SchemaType<ResourceConfig<T>>
type ResourceState<T extends ResourceMetaData<any, any>> = T extends ResourceMetaData<any, infer S> ? S : never
type ResourceStateType<T extends ResourceMetaData<any, any>> = ResolvedSchemaType<ResourceState<T>>

function SchemaResourceType<MetaData extends ResourceMetaData<any, any>>(metaData: MetaData) {
	return class {
		static readonly metaData = metaData

		protected _id: string
		get id() {
			return this._id
		}

		//Handle JSON.stringify
		toJSON() {
			return this.id
		}

		protected _config: ResourceConfigType<MetaData>
		protected _state: ResourceStateType<MetaData>

		get config() {
			return this._config
		}

		protected async updateUI() {}

		async setConfig(config: ResourceConfigType<MetaData>) {
			this._config = config
			await this.updateUI()
			return true
		}

		async applyConfig(config: Partial<ResourceConfigType<MetaData>>) {
			Object.assign(this._config, config)
			await this.updateUI()
			return true
		}

		get state() {
			return ReactiveGet(this._state, this, "state")
		}
		set state(newState: ResourceStateType<MetaData>) {
			this._state = newState
			ReactiveSet(this, "state")
		}

		static async initialize() {
			//@ts-ignore
			ResourceRegistry.getInstance().register(this)
		}

		static async uninitialize() {
			//@ts-ignore
			ResourceRegistry.getInstance().unregister(this)
		}
	}
}

const TestResourceMetaData = defineResourceMetaData({
	name: "TestResource",
	config: {
		type: Object,
		properties: {
			hello: { type: String, name: "Hello", required: true, default: "hello" },
		},
	},
})

class TestResource extends SchemaResourceType(TestResourceMetaData) {
	hello() {
		console.log(this.config)
	}
}

async function test() {
	const t = new TestResource()
}
