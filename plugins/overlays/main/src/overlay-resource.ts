import {
	FileResource,
	PluginManager,
	ReactiveEffect,
	ResourceStorage,
	Service,
	autoRerun,
	defineIPCFunc,
	definePluginResource,
	ipcParseSchema,
	remoteTemplateSchema,
	usePluginLogger,
} from "castmate-core"
import { IPCOverlayWidgetDescriptor, OverlayConfig, OverlayWidgetOptions } from "castmate-plugin-overlays-shared"
import { Schema, SchemaObj, filterPromiseAll } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"

const logger = usePluginLogger("overlays")

export class Overlay extends FileResource<OverlayConfig> {
	static resourceDirectory: string = "./overlays"
	static storage = new ResourceStorage<Overlay>("Overlay")

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			size: { width: 1920, height: 1080 },
			widgets: [],
		}
	}
}

interface OverlayWidgetDescriptor {
	plugin: string
	options: OverlayWidgetOptions
}

export const OverlayWidgetManager = Service(
	class {
		private widgets = new Map<string, OverlayWidgetDescriptor>()

		constructor() {
			defineIPCFunc("overlays", "setWidgets", (widgetList: IPCOverlayWidgetDescriptor[]) => {
				for (const widget of widgetList) {
					const parsedWidget: OverlayWidgetDescriptor = {
						plugin: widget.plugin,
						options: {
							id: widget.options.id,
							name: widget.options.name,
							description: widget.options.description,
							icon: widget.options.icon,
							defaultSize: widget.options.defaultSize,
							config: ipcParseSchema(widget.options.config) as SchemaObj,
						},
					}

					this.widgets.set(`${widget.plugin}.${widget.options.id}`, parsedWidget)

					logger.log("Received Overlay Widget", widget.plugin, widget.options.id)
					logger.log(parsedWidget.options.config)
				}
			})
		}

		getWidget(plugin: string, widget: string) {
			return this.widgets.get(`${plugin}.${widget}`)
		}
	}
)

interface OverlayConfigEvaluator {
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

export function disposeOverlayEvaluator(evaluator: OverlayConfigEvaluator) {
	evaluator.effect?.dispose()
}

export function setupOverlayResources() {
	OverlayWidgetManager.initialize()
	definePluginResource(Overlay)
}
