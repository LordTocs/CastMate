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
import { DashboardConfig } from "castmate-plugin-dashboards-shared"
import { filterPromiseAll } from "castmate-schema"

const logger = usePluginLogger("dashboards")

export interface DashboardConfigEvaluator {
	config: DashboardConfig
	effect?: ReactiveEffect
	remoteConfig: DashboardConfig
	sender: (config: DashboardConfig) => any
}

export async function createDashboardConfigEvaluator(
	initialConfig: DashboardConfig,
	sender: (config: DashboardConfig) => any
) {
	const evaluator: DashboardConfigEvaluator = {
		config: initialConfig,
		remoteConfig: initialConfig,
		sender,
	}

	evaluator.effect = await autoRerun(async () => {
		evaluator.remoteConfig = {
			name: evaluator.config.name,
			pages: await filterPromiseAll(
				evaluator.config.pages.map(async (p) => {
					return {
						id: p.id,
						name: p.name,
						sections: await filterPromiseAll(
							p.sections.map(async (s) => {
								return {
									id: s.id,
									name: s.name,
									columns: s.columns,
									widgets: await filterPromiseAll(
										s.widgets.map(async (w) => {
											const widgetType = DashboardWidgetManager.getInstance().getWidget(
												w.plugin,
												w.widget
											)
											if (!widgetType) throw new Error(`Missing Widget ${w.plugin}.${w.widget}`)
											return {
												id: w.id,
												size: w.size,
												plugin: w.plugin,
												widget: w.widget,
												config: await remoteTemplateSchema(
													w.config,
													widgetType.options.config,
													PluginManager.getInstance().state
												),
											}
										})
									),
								}
							})
						),
					}
				})
			),
			remoteTwitchIds: evaluator.config.remoteTwitchIds,
		}

		ignoreReactivity(() => sender(evaluator.remoteConfig))
	})

	return evaluator
}

export function disposeDashboardEvaluator(evaluator?: DashboardConfigEvaluator) {
	evaluator?.effect?.dispose()
}

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
