export * from "./plugins/plugin"
export * from "./profile/profile"
export * from "./queue-system/action"
export * from "./queue-system/action-queue"
export * from "./queue-system/sequence"
export * from "./queue-system/trigger"
export * from "./resources/resource"
export * from "./resources/resource-registry"
export * from "./resources/file-resource"
/*
import { nanoid } from "nanoid"
import { defineAction } from "./queue-system/action"
import { defineTrigger } from "./queue-system/trigger"
import { Reactive, autoRerun } from "./reactivity/reactivity"
import { loadResources, saveResource } from "./resources/file-resource"
import {
	ExtendedResource,
	RegisterResource,
	ResourceConfig,
	ResourceStorage,
	defineResource,
	extendResource,
} from "./resources/resource"
import { ResourceRegistry } from "./resources/resource-registry"

ResourceRegistry.initialize()

defineAction({
	name: "TestAction",
	config: {
		type: Object,
		properties: {
			hello: { type: String },
		},
	},
	async invoke(config, contextData, abortSignal) {
		//Make smartlight api call here
	},
})

defineTrigger({
	name: "Test Trigger",
	config: {
		type: Object,
		properties: {
			message: { type: String, required: true, default: "foo!" },
		},
	},
	context: {
		type: Object,
		properties: {
			message: { type: String },
		},
	},
	async handle(config, context) {
		return context.message?.startsWith(config.message) ?? false
	},
})

//Resources

@RegisterResource
class TestResource extends defineResource({
	config: {
		type: Object,
		properties: {
			hello: { type: String },
		},
	},
	state: {
		type: Object,
		properties: {
			goodbye: { type: String },
		},
	},
}) {
	static readonly storage = new ResourceStorage<TestResource>()
}

// Resource Inheritence

@RegisterResource
class LightResource extends defineResource({
	config: {
		type: Object,
		properties: {
			hasColor: { type: Boolean, required: true, default: false },
			hasTemperature: { type: Boolean, required: true, default: false },
		},
	},
	state: {
		type: Object,
		properties: {
			on: { type: Boolean, required: true, default: false },
		},
	},
}) {
	static storage = new ResourceStorage<LightResource>()

	async setLightState(on: boolean) {}

	static async load() {
		await this.loadDerived()
	}
}

@ExtendedResource
class BrandLightResource extends extendResource(
	{
		config: {
			type: Object,
			properties: {
				brandId: { type: String, required: true, default: "" },
			},
		},
		state: {
			type: Object,
			properties: {},
		},
	},
	LightResource
) {
	async setLightState(on: boolean) {}

	static async load() {
		//Query the hub here.
	}
}

///

class SavedResource extends defineResource({
	config: {
		type: Object,
		properties: {
			hello: { type: String },
		},
	},
	state: {
		type: Object,
		properties: {},
	},
}) {
	static storage = new ResourceStorage<SavedResource>()

	async setConfig(config: ResourceConfig<SavedResource>): Promise<void> {
		await super.setConfig(config)

		await saveResource(this, "/test")
	}

	static async load() {
		const resources = await loadResources(SavedResource, "/test")

		//Do some init work

		this.storage.inject(...resources)
	}

	static async create(config: ResourceConfig<SavedResource>): Promise<SavedResource> {
		const resource = new SavedResource(nanoid(), config)
		await saveResource(resource, "/test")
		this.storage.inject(resource)

		return resource
	}
}
// REACTIVITY

class Foo {
	hello: string = "Yo"
}

class NonReactive {
	foo: string = "foo"

	@Reactive
	accessor bar: Foo
}

const f = new NonReactive()

autoRerun(async () => {
	console.log("Hello", f.bar?.hello)
})

f.foo = "FOO"
f.bar = { hello: "BONJOUR" }

setTimeout(() => {
	f.bar.hello = "HI"
}, 500)

setTimeout(() => {
	console.log("Done")
}, 1000)
*/
