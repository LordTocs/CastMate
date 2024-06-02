import { Toggle } from "castmate-schema"
import {
	ActionQueue,
	Automation,
	Profile,
	SequenceRunner,
	WebService,
	defineAction,
	definePlugin,
	defineSetting,
	onLoad,
	runOnChange,
} from "castmate-core"

export default definePlugin(
	{
		id: "castmate",
		name: "CastMate",
		icon: "cmi cmi-castmate",
		color: "#DE84FF",
		description: "Builtin Actions and Triggers",
	},
	() => {
		const port = defineSetting("port", {
			type: Number,
			required: true,
			default: 8181,
			min: 1,
			max: 65535,
			name: "Internal Webserver Port",
		})

		onLoad(() => {
			WebService.getInstance().startHttp(port.value)
		})

		runOnChange(
			() => port.value,
			() => {
				WebService.getInstance().updatePort(port.value)
			}
		)

		defineAction({
			id: "skip",
			name: "Queue Skip",
			icon: "mdi mdi-skip-next",
			config: {
				type: Object,
				properties: {
					queue: { type: ActionQueue, name: "Queue", required: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				const runningId = config.queue?.state?.running?.id
				if (runningId) {
					config.queue.skip(runningId)
				}
			},
		})

		defineAction({
			id: "profileActivation",
			name: "Profile Activation",
			icon: "mdi mdi-cogs",
			description: "Sets a profile's activation mode",
			config: {
				type: Object,
				properties: {
					profile: { type: Profile, name: "Profile", required: true },
					activation: {
						type: Toggle,
						name: "Activation Mode",
						required: true,
						default: true,
						toggleIcon: "mdi mdi-cogs",
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.profile?.applyConfig({
					activationMode: config.activation,
				})
			},
		})

		defineAction({
			id: "toggleProfileActivation",
			name: "Toggle Profile Activation",
			icon: "mdi mdi-cogs",
			description: "Toggle's a Profile's Activation Mode",
			config: {
				type: Object,
				properties: {
					profile: { type: Profile, name: "Profile", required: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				if (!config.profile) return

				const mode = !config.profile.state.active

				await config.profile?.applyConfig({
					activationMode: mode,
				})
			},
		})

		//TODO: Detect length of automation
		defineAction({
			id: "runAutomation",
			name: "Run Automation",
			icon: "mdi mdi-cogs",
			description: "Runs an automation",
			config: {
				type: Object,
				properties: {
					automation: { type: Automation, name: "Automation", required: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				const runner = new SequenceRunner(config.automation.config.sequence, contextData)

				const onabort = () => runner.abort()

				//Link up the sequence runners abort
				abortSignal.addEventListener("abort", onabort, { once: true })

				await runner.run()

				abortSignal.removeEventListener("abort", onabort)
			},
		})
	}
)
