import { Duration, Toggle, Timer, isTimerStarted, offsetTimer, pauseTimer, setTimer, startTimer } from "castmate-schema"
import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	abortableSleep,
	usePluginLogger,
} from "castmate-core"
import { setupTimers } from "./timers"
import { VariableManager } from "castmate-plugin-variables-main"

export default definePlugin(
	{
		id: "time",
		name: "Time",
		description: "Time Utilities",
		icon: "mdi mdi-clock-outline",
		color: "#8DC1C0",
	},
	() => {
		const logger = usePluginLogger()

		defineAction({
			id: "delay",
			name: "Delay",
			icon: "mdi mdi-timer-sand",
			duration: {
				dragType: "length",
				rightSlider: {
					sliderProp: "duration",
				},
			},
			config: {
				type: Object,
				properties: {
					duration: { type: Duration, name: "Duration", template: true, required: true, default: 1.0 },
				},
			},
			async invoke(config, contextData, abortSignal) {
				const start = Date.now()
				await abortableSleep(config.duration * 1000, abortSignal)
				const end = Date.now()

				const waited = (end - start) / 1000
				const delta = config.duration - waited
				const absDelta = Math.abs(delta)

				if (absDelta > 0.01) {
					logger.error(
						`Delay Inaccuracy! Waited ${waited}/${config.duration} : ${
							abortSignal.aborted ? "aborted" : "not aborted"
						}`
					)
				}
			},
		})

		defineAction({
			id: "toggleTimer",
			name: "Toggle Timer",
			icon: "mdi mdi-timer-outline",
			config: {
				type: Object,
				properties: {
					timer: {
						type: String,
						name: "Timer",
						required: true,
						async enum() {
							return VariableManager.getInstance()
								.variableDefinitions.filter((v) => v.schema.type == Timer)
								.map((v) => v.id)
						},
					},
					on: {
						type: Toggle,
						name: "Start/Stop",
						required: true,
						default: true,
						template: true,
						trueIcon: "mdi mdi-timer-play-outline",
						falseIcon: "mdi mdi-timer-pause-outline",
					},
				},
			},
			result: {
				type: Object,
				properties: {
					timerRunning: { type: Boolean, name: "Timer Running", required: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				const timer = VariableManager.getInstance().getVariable<Timer>(config.timer)
				if (!timer) {
					logger.error("Missing Timer", config.timer)
					return { timerRunning: false }
				}

				let on = config.on
				if (on == "toggle") {
					on = !isTimerStarted(timer.ref.value)
				}

				if (on) {
					timer.ref.value = startTimer(timer.ref.value)
				} else {
					timer.ref.value = pauseTimer(timer.ref.value)
				}

				return {
					timerRunning: on,
				}
			},
		})

		defineAction({
			id: "setTimer",
			name: "Set Timer",
			icon: "mdi mdi-timer-outline",
			config: {
				type: Object,
				properties: {
					timer: {
						type: String,
						required: true,
						name: "Timer",
						async enum() {
							return VariableManager.getInstance()
								.variableDefinitions.filter((v) => v.schema.type == Timer)
								.map((v) => v.id)
						},
					},
					duration: { type: Duration, name: "Duration", template: true, required: true, default: 5 },
				},
			},
			async invoke(config, contextData, abortSignal) {
				const timer = VariableManager.getInstance().getVariable<Timer>(config.timer)
				if (!timer) {
					logger.error("Missing Timer", config.timer)
					return
				}

				timer.ref.value = setTimer(timer.ref.value, config.duration)
			},
		})

		defineAction({
			id: "offsetTimer",
			name: "Offset Timer",
			icon: "mdi mdi-timer-plus-outline",
			config: {
				type: Object,
				properties: {
					timer: {
						type: String,
						required: true,
						name: "Timer",
						async enum() {
							return VariableManager.getInstance()
								.variableDefinitions.filter((v) => v.schema.type == Timer)
								.map((v) => v.id)
						},
					},
					duration: { type: Duration, name: "Duration", template: true, required: true, default: 5 },
				},
			},
			async invoke(config, contextData, abortSignal) {
				const timer = VariableManager.getInstance().getVariable<Timer>(config.timer)
				if (!timer) {
					logger.error("Missing Timer", config.timer)
					return
				}

				timer.ref.value = offsetTimer(timer.ref.value, config.duration)
			},
		})

		setupTimers()
	}
)
