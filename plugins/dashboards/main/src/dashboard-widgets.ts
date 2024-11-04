import { defineIPCFunc, ipcParseSchema, Service, usePluginLogger } from "castmate-core"
import { DashboardWidgetDescriptor, IPCDashboardWidgetDescriptor } from "castmate-plugin-dashboards-shared"
import { SchemaObj } from "castmate-schema"

const logger = usePluginLogger("dashboards")

export const DashboardWidgetManager = Service(
	class {
		private widgets = new Map<string, DashboardWidgetDescriptor>()

		private initialized = false

		constructor() {
			defineIPCFunc("dashboards", "setWidgets", (widgetList: IPCDashboardWidgetDescriptor[]) => {
				for (const widget of widgetList) {
					const parsedWidget: DashboardWidgetDescriptor = {
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

					logger.log("Received Dashboard Widget", widget.plugin, widget.options.id)
				}

				this.doInitialSetup()
			})
		}

		private async doInitialSetup() {
			if (this.initialized) {
				return
			}

			this.initialized = true
		}

		getWidget(plugin: string, widget: string) {
			return this.widgets.get(`${plugin}.${widget}`)
		}
	}
)
