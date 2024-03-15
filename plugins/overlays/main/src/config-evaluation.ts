import {
	PluginManager,
	ReactiveEffect,
	Service,
	autoRerun,
	defineIPCFunc,
	defineIPCFuncRaw,
	remoteTemplateSchema,
	serializeSchema,
	usePluginLogger,
} from "castmate-core"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { filterPromiseAll } from "castmate-schema"
import { OverlayWidgetManager } from "./overlay-resource"

const logger = usePluginLogger("overlays")

export interface OverlayConfigEvaluator {
	config: OverlayConfig
	effect?: ReactiveEffect
	remoteConfig: OverlayConfig
	sender: (config: OverlayConfig) => any
}

export async function createOverlayEvaluator(initialConfig: OverlayConfig, sender: (config: OverlayConfig) => any) {
	const evaluator: OverlayConfigEvaluator = {
		config: initialConfig,
		remoteConfig: initialConfig,
		sender,
	}

	evaluator.effect = await autoRerun(async () => {
		evaluator.remoteConfig = {
			name: evaluator.config.name,
			size: evaluator.config.size,
			widgets: await filterPromiseAll(
				evaluator.config.widgets.map(async (w) => {
					const widget = OverlayWidgetManager.getInstance().getWidget(w.plugin, w.widget)
					if (!widget) throw new Error(`Missing Widget ${w.plugin}.${w.widget}`)
					return {
						id: w.id,
						plugin: w.plugin,
						widget: w.widget,
						name: w.name,
						size: w.size,
						position: w.position,
						config: await remoteTemplateSchema(
							w.config,
							widget.options.config,
							PluginManager.getInstance().state
						),
					}
				})
			),
		}
	})

	return evaluator
}

export function disposeOverlayEvaluator(evaluator?: OverlayConfigEvaluator) {
	evaluator?.effect?.dispose()
}

interface OverlayWidgetEvaluator {
	plugin: string
	widget: string
	config: object
	remoteConfig: object
	sender: (config: object) => any
	effect?: ReactiveEffect
}

export async function createOverlayWidgetEvaluator(
	plugin: string,
	widget: string,
	config: object,
	sender: (config: object) => any
) {
	const evaluator: OverlayWidgetEvaluator = {
		plugin,
		widget,
		config,
		remoteConfig: {},
		sender,
	}

	evaluator.effect = await autoRerun(async () => {
		const widgetInfo = OverlayWidgetManager.getInstance().getWidget(evaluator.plugin, evaluator.widget)

		if (!widgetInfo) throw new Error("Missing Widget!")

		evaluator.remoteConfig = await remoteTemplateSchema(
			evaluator.config,
			widgetInfo.options.config,
			PluginManager.getInstance().state
		)

		sender(evaluator.remoteConfig)
	})

	return evaluator
}

export const OverlayEditorConfigBridge = Service(
	class {
		private evaluators = new Map<string, OverlayWidgetEvaluator>()

		constructor() {
			defineIPCFuncRaw(
				"overlays",
				"startEdit",
				async (event, id: string, plugin: string, widget: string, initialConfig: object) => {
					if (this.evaluators.has(id)) throw new Error("Already has id")

					logger.log("Creating Overlay Edit", id, plugin, widget, initialConfig)

					const evaluator = await createOverlayWidgetEvaluator(
						plugin,
						widget,
						initialConfig,
						async (config) => {
							logger.log("Sending Updated Config", id, config)
							//We don't need to serialize any schemas, since they have been templated for remote!
							event.sender.send("overlays_configUpdated", id, config)
						}
					)

					this.evaluators.set(id, evaluator)
				}
			)

			defineIPCFunc("overlays", "stopEdit", async (id: string) => {
				const evaluator = this.evaluators.get(id)
				evaluator?.effect?.dispose()
				this.evaluators.delete(id)
			})

			defineIPCFunc(
				"overlays",
				"updateEdit",
				async (id: string, plugin: string, widget: string, newConfig: OverlayConfig) => {
					const evaluator = this.evaluators.get(id)
					if (!evaluator) throw new Error("Evaluator doesn't exist")

					logger.log("Receiving Overlay Edit", id, plugin, widget, newConfig)

					evaluator.plugin = plugin
					evaluator.widget = widget
					evaluator.config = newConfig
					evaluator.effect?.trigger()
				}
			)
		}
	}
)

export function setupConfigEval() {
	OverlayEditorConfigBridge.initialize()
}
