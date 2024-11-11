import { constructDefault, Toggle } from "castmate-schema"
import {
	ActionQueue,
	Automation,
	Profile,
	ReactiveEffect,
	SequenceRunner,
	WebService,
	defineAction,
	definePlugin,
	defineSetting,
	defineTrigger,
	forceRunWithEffect,
	getSequenceHash,
	onLoad,
	onProfilesChanged,
	runOnChange,
	touchAllSequenceTemplates,
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

		const autoRunners = new Map<
			string,
			{
				triggerHash: number
				effect: ReactiveEffect
			}
		>()

		const autoRun = defineTrigger({
			id: "autoRun",
			name: "Run On Change",
			icon: "mdi mdi-cogs",
			description: "Automatically triggers when the values it uses changes.",
			config: {
				type: Object,
				properties: {},
			},
			context: {
				type: Object,
				properties: {
					triggerId: { type: String, required: true, view: false },
					profileId: { type: String, required: true, view: false },
				},
			},
			async handle(config, context, mapping) {
				if (mapping.profileId != context.profileId) return false
				if (mapping.triggerId != context.triggerId) return false
				return true
			},
			runWrapper(inner, mapping) {
				const key = `${mapping.profileId}.${mapping.triggerId}`
				const runner = autoRunners.get(key)

				if (runner) {
					forceRunWithEffect(runner.effect, inner)
				} else {
					return inner()
				}
			},
		})

		onProfilesChanged((active, inactive) => {
			for (const profile of active) {
				for (const trigger of profile.iterTriggers(autoRun)) {
					const key = `${profile.id}.${trigger.id}`

					const existing = autoRunners.get(key)
					const hash = getSequenceHash(trigger.sequence)
					if (!existing) {
						const effect = new ReactiveEffect(() => {
							autoRun({
								profileId: profile.id,
								triggerId: trigger.id,
							})
						})
						autoRunners.set(key, {
							triggerHash: hash,
							effect,
						})
						effect.run()
					} else {
						if (hash != existing.triggerHash) {
							existing.triggerHash = hash
							existing.effect.trigger()
						}
					}
				}
			}

			for (const profile of inactive) {
				for (const trigger of profile.iterTriggers(autoRun)) {
					const key = `${profile.id}.${trigger.id}`
					const existing = autoRunners.get(key)
					if (existing) {
						existing.effect.dispose()
						autoRunners.delete(key)
					}
				}
			}
		})
	}
)
