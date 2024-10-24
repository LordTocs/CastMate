import {
	PluginManager,
	ReactiveEffect,
	Service,
	autoRerun,
	defineIPCFunc,
	defineIPCFuncRaw,
	ignoreReactivity,
	remoteTemplateSchema,
	usePluginLogger,
} from "castmate-core"
import { DashboardWidgetManager } from "./dashboard-widgets"

const logger = usePluginLogger("dashboards")

interface DashboardWidgetEvaluator {
	plugin: string
	widget: string
	config: object
	remoteConfig: object
	sender: (config: object) => any
	effect?: ReactiveEffect
}

export async function createDashboardWidgetEvaluator(
	plugin: string,
	widget: string,
	config: object,
	sender: (config: object) => any
) {
	const evaluator: DashboardWidgetEvaluator = {
		plugin,
		widget,
		config,
		remoteConfig: {},
		sender,
	}

	evaluator.effect = await autoRerun(async () => {
		const widgetInfo = DashboardWidgetManager.getInstance().getWidget(evaluator.plugin, evaluator.widget)

		if (!widgetInfo) throw new Error("Missing Widget!")

		evaluator.remoteConfig = await remoteTemplateSchema(
			evaluator.config,
			widgetInfo.options.config,
			PluginManager.getInstance().state
		)

		ignoreReactivity(() => sender(evaluator.remoteConfig))
	})

	return evaluator
}

export const DashboardEditorConfigBridge = Service(
	class {
		private evaluators = new Map<string, DashboardWidgetEvaluator>()

		constructor() {
			defineIPCFuncRaw(
				"dashboards",
				"startEdit",
				async (event, id: string, plugin: string, widget: string, initialConfig: object) => {
					logger.log("Creating Dashboard Edit", id, plugin, widget)

					const evaluator = await createDashboardWidgetEvaluator(
						plugin,
						widget,
						initialConfig,
						async (config) => {
							event.sender.send("dashboards_configUpdated", id, config)
						}
					)

					this.evaluators.set(id, evaluator)
				}
			)

			defineIPCFunc("dashboards", "stopEdit", async (id: string) => {
				const evaluator = this.evaluators.get(id)
				evaluator?.effect?.dispose()
				this.evaluators.delete(id)
			})

			defineIPCFunc(
				"dashboards",
				"updateEdit",
				async (id: string, plugin: string, widget: string, newConfig: object) => {
					const evaluator = this.evaluators.get(id)

					if (!evaluator) throw new Error("Eval doesn't exist")

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
	DashboardEditorConfigBridge.initialize()
}
