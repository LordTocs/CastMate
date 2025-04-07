import {
	FileResource,
	PluginManager,
	ReactiveEffect,
	ResourceStorage,
	Service,
	autoRerun,
	defineAction,
	defineIPCFunc,
	definePluginResource,
	ipcParseSchema,
	onWebsocketMessage,
	remoteTemplateSchema,
	sleep,
	usePluginLogger,
} from "castmate-core"
import {
	InitialOverlayConfig,
	IPCOverlayWidgetDescriptor,
	OverlayConfig,
	OverlaySoundConfig,
	OverlayWidget,
	OverlayWidgetConfig,
	OverlayWidgetOptions,
} from "castmate-plugin-overlays-shared"
import { Schema, SchemaObj, Toggle, filterPromiseAll } from "castmate-schema"
import { nanoid } from "nanoid/non-secure"
import { setupConfigEval } from "./config-evaluation"
import { OverlayWebsocketService } from "./websocket-bridge"
import { OBSConnection } from "castmate-plugin-obs-main"

import { SoundOutput } from "castmate-plugin-sound-main"

const logger = usePluginLogger("overlays")

export class Overlay extends FileResource<OverlayConfig> {
	static resourceDirectory: string = "./overlays"
	static storage = new ResourceStorage<Overlay>("Overlay")

	constructor(initialConfig?: InitialOverlayConfig) {
		super()

		if (initialConfig) {
			this._id = nanoid()
		}

		this._config = {
			name: initialConfig?.name ?? "",
			size: initialConfig?.size ?? { width: 1920, height: 1080 },
			widgets: [],
		}
	}

	async setConfig(config: OverlayConfig): Promise<boolean> {
		const result = await super.setConfig(config)
		OverlayWebsocketService.getInstance().overlayConfigChanged(this.id)

		const soundProxy = SoundOutput.storage.getById(`overlay-audio.${this.id}`) as OverlaySoundOutput | undefined
		if (soundProxy) {
			await soundProxy.applyConfig({ name: `Overlay - ${config.name}` })
		}

		return result
	}

	async applyConfig(config: Partial<OverlayConfig>): Promise<boolean> {
		const result = await super.applyConfig(config)
		OverlayWebsocketService.getInstance().overlayConfigChanged(this.id)

		if ("name" in config) {
			const soundProxy = SoundOutput.storage.getById(`overlay-audio.${this.id}`) as OverlaySoundOutput | undefined
			if (soundProxy) {
				await soundProxy.applyConfig({ name: `Overlay - ${config.name}` })
			}
		}

		return result
	}

	getWidgetConfig(widgetId: string) {
		return this.config.widgets.find((w) => w.id == widgetId)
	}

	async setWidgetConfig(widgetId: string, config: OverlayWidgetConfig) {
		const idx = this.config.widgets.findIndex((w) => w.id == widgetId)
		if (idx == -1) return

		const newWidgets = [...this.config.widgets]
		newWidgets[idx] = config

		await this.applyConfig({ widgets: newWidgets })
	}

	async load(savedConfig: OverlayConfig) {
		logger.log("Loading Overlay", savedConfig)
		const result = await super.load(savedConfig)

		if (result) {
			const soundProxy = new OverlaySoundOutput(`Overlay - ${savedConfig.name}`, this._id)
			await SoundOutput.storage.inject(soundProxy)
		}

		return result
	}

	static async onDelete(resource: Overlay) {
		await super.onDelete(resource)
		await OverlaySoundOutput.storage.remove(`overlay-audio.${resource.id}`)
	}

	static async onCreate(resource: Overlay) {
		await super.onCreate(resource)
		const soundProxy = new OverlaySoundOutput(`Overlay - ${resource.config.name}`, resource.id)
		await SoundOutput.storage.inject(soundProxy)
	}
}

export class OverlaySoundOutput extends SoundOutput<OverlaySoundConfig> {
	constructor(name: string, overlayId: string) {
		super()
		this._id = `overlay-audio.${overlayId}`
		this._config = {
			name,
			overlayId,
		}

		logger.log("Creating Overlay Sound Proxy", this.config)
	}

	async playFile(
		file: string,
		startSec: number,
		endSec: number,
		volume: number,
		abortSignal: AbortSignal
	): Promise<boolean> {
		const playId = nanoid()

		abortSignal.onabort = () =>
			OverlayWebsocketService.getInstance().cancelOverlayAudio(this.config.overlayId, playId)

		const playTime = Math.max(endSec - startSec, 0)

		await Promise.allSettled([
			OverlayWebsocketService.getInstance().playOverlayAudio(
				this.config.overlayId,
				playId,
				file,
				startSec,
				endSec,
				volume
			),
			sleep(playTime * 1000),
		])

		return true
	}
}

interface OverlayWidgetDescriptor {
	plugin: string
	options: OverlayWidgetOptions
}

export const OverlayWidgetManager = Service(
	class {
		private widgets = new Map<string, OverlayWidgetDescriptor>()

		private initialized = false

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

				this.doInitialSetup()
			})
		}

		private async doInitialSetup() {
			if (this.initialized) {
				return
			}

			this.initialized = true

			for (const connection of OBSConnection.storage) {
				connection.refreshBrowsersByUrlPattern(`http://[\\w]+(:[\\d]+)?[/\\\\]overlays[/\\\\]`)
			}
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

	defineAction({
		id: "widgetVisibility",
		name: "Widget Visibility",
		description: "Toggles a Widget's visibliity on an overlay.",
		icon: "mdi mdi-eye",
		config: {
			type: Object,
			properties: {
				widget: { type: OverlayWidget, required: true, name: "Widget" },
				enabled: {
					type: Toggle,
					name: "Widget Visibility",
					required: true,
					default: true,
					template: true,
					trueIcon: "mdi mdi-eye-outline",
					falseIcon: "mdi mdi-eye-off-outline",
				},
			},
		},
		result: {
			type: Object,
			properties: {
				widgetVisible: { type: Boolean, name: "Widget Visible", required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			const overlay = Overlay.storage.getById(config.widget?.overlayId)
			const widget = overlay?.getWidgetConfig(config.widget.widgetId)

			if (!widget || !overlay) return { widgetVisible: false }

			let visible = config.enabled == "toggle" ? !widget.visible : config.enabled

			await overlay.setWidgetConfig(config.widget.widgetId, {
				...widget,
				visible,
			})

			return {
				widgetVisible: visible,
			}
		},
	})
}
