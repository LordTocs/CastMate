import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	onWebsocketMessage,
	useHTTPRouter,
	ProfileManager,
	Profile,
	usePluginLogger,
} from "castmate-core"
import { isString } from "castmate-schema"

export default definePlugin(
	{
		id: "remote",
		name: "Remote",
		description: "Allows various programs to remotely trigger CastMate",
		icon: "mdi mdi-remote",
		color: "#D554FF",
	},
	() => {
		const logger = usePluginLogger()
		const httpRoutes = useHTTPRouter("remote")

		const remoteButton = defineTrigger({
			id: "button",
			name: "Remote Button",
			icon: "mdi mdi-remote",
			description: "Allows things like StreamDeck or Deckboard to trigger with a button press.",
			config: {
				type: Object,
				properties: {
					name: { type: String, name: "Button Name", required: true },
				},
			},
			context: {
				type: Object,
				properties: {
					name: { type: String, name: "Button Name", required: true },
				},
			},
			async handle(config, context, mapping) {
				return config.name == context.name
			},
		})

		onLoad(() => {
			httpRoutes.get("/buttons", (req, res, next) => {
				const names = new Set<string>()

				for (const profile of Profile.storage) {
					for (const trigger of profile.iterTriggers(remoteButton)) {
						names.add(trigger.config.name)
					}
				}

				res.send({
					buttons: Array.from(names),
				})

				next()
			})

			httpRoutes.post("/buttons/press", (req, res, next) => {
				const buttonName = req.query["button"]

				if (!buttonName || !isString(buttonName)) {
					return res.status(404).send()
				}

				remoteButton({
					name: buttonName,
				})

				res.status(204).send()
				next()
			})
		})
	}
)
