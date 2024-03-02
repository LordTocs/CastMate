import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	reactiveRef,
	onCloudPubSubMessage,
} from "castmate-core"
import { TwitchViewer } from "castmate-plugin-twitch-shared"
import { setupSpells } from "./spell"

export default definePlugin(
	{
		id: "spellcast",
		name: "SpellCast",
		description: "UI Description",
		icon: "sci sci-spellcast",
	},
	() => {
		setupSpells()
	}
)
