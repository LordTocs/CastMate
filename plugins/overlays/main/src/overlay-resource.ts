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
	onWebsocketMessage,
	remoteTemplateSchema,
	usePluginLogger,
} from "castmate-core"
import { IPCOverlayWidgetDescriptor, OverlayConfig, OverlayWidgetOptions } from "castmate-plugin-overlays-shared"
import { Schema, SchemaObj, filterPromiseAll } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { setupConfigEval } from "./config-evaluation"
import { OverlayWebsocketService } from "./websocket-bridge"

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

	async setConfig(config: OverlayConfig): Promise<boolean> {
		const result = await super.setConfig(config)
		OverlayWebsocketService.getInstance().overlayConfigChanged(this.id)
		return result
	}

	async applyConfig(config: Partial<OverlayConfig>): Promise<boolean> {
		const result = await super.applyConfig(config)
		OverlayWebsocketService.getInstance().overlayConfigChanged(this.id)
		return result
	}

	getWidgetConfig(widgetId: string) {
		return this.config.widgets.find((w) => w.id == widgetId)
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
				}
			})
		}

		getWidget(plugin: string, widget: string) {
			return this.widgets.get(`${plugin}.${widget}`)
		}
	}
)

export function setupOverlayResources() {
	OverlayWidgetManager.initialize()
	setupConfigEval()
	definePluginResource(Overlay)
}
