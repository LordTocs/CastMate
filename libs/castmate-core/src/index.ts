export * from "./plugins/plugin"
export * from "./profile/profile"
export * from "./queue-system/action"
export * from "./queue-system/action-queue"
export * from "./queue-system/sequence"
export * from "./queue-system/trigger"
export * from "./resources/resource"
export * from "./resources/resource-registry"
//export * from "./resources/file-resource"
export * from "./accounts/account"

export * from "./profile/profile"
export * from "./queue-system/action-queue"

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
