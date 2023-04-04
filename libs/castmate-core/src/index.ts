import { SchemaObject, SchemaProp } from "./data/schema"
import { Reactive, autoRerun } from "./reactivity/reactivity"
import { RegisterResource, ResourceType } from "./resources/resource"
import { ResourceRegistry } from "./resources/resource-registry"

class ChannelPointRewardConfig extends SchemaObject<ChannelPointRewardConfig>() {
	@SchemaProp({
		name: "Text",
	})
	text: string = "Yo"
}

class ChannelPointRewardState extends SchemaObject<ChannelPointRewardState>() {
	@SchemaProp({
		name: "Blept",
	})
	blept: string = "Yo"
}

ResourceRegistry.initialize()

@RegisterResource
class ChannelPointReward extends ResourceType<ChannelPointReward>() {
	config: ChannelPointRewardConfig = new ChannelPointRewardConfig()

	@Reactive
	accessor state: ChannelPointRewardState = new ChannelPointRewardState()
}

ResourceRegistry.getInstance().create("ChannelPointReward")

for (let cpr of ChannelPointReward.storage) {
	console.log("CPR:", cpr)
}

/*
class LightConfig extends SchemaObject<LightConfig>() {}

const Light = defineResource(
	class Light {
		id: string
		config: LightConfig
	}
)

class HUELight extends Light {}

class TPLinkLight extends Light {}
*/

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
