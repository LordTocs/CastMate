import { DialogServiceMethods } from "primevue/dialogservice"
//@ts-ignore
import DynamicDialogEventBus from "primevue/dynamicdialogeventbus"

import { type EventBus } from "primevue/utils"

export const dialogEventBus: ReturnType<typeof EventBus> = DynamicDialogEventBus

import { inject, type Ref, computed, App, Component, markRaw, onMounted, onBeforeUnmount } from "vue"

declare module "primevue/usedialog" {
	const PrimeVueDialogSymbol: any
}
import { PrimeVueDialogSymbol } from "primevue/usedialog"
import { DynamicDialogCloseOptions, DynamicDialogOptions } from "primevue/dynamicdialogoptions"

export type DynamicDialogInstance = ReturnType<DialogServiceMethods["open"]> & { visible: boolean; key: string }

export function useDialogRef() {
	return inject<Ref<DynamicDialogInstance | undefined>>(
		"dialogRef",
		computed(() => undefined)
	)
}

interface DialogEvents {
	open: { instance: DynamicDialogInstance }
	close: { instance: DynamicDialogInstance; params: DynamicDialogCloseOptions }
}

export function useDialogEvent<Event extends keyof DialogEvents>(
	eventName: Event,
	func: (arg: DialogEvents[Event]) => any
) {
	onMounted(() => {
		dialogEventBus.on(eventName, func)
	})

	onBeforeUnmount(() => {
		dialogEventBus.off(eventName, func)
	})
}

//This sets up our own dialog service inplace of the regular primevue dynamic dialog.
//This way we can control the extra data needed for errors and such when we have cancellable close dynamic dialogs
export function setupProxyDialogService(app: App) {
	const fakeService = {
		open: (content: Component, options: DynamicDialogOptions): DynamicDialogInstance => {
			const instance: DynamicDialogInstance = {
				key: "",
				visible: false,
				content: content && markRaw(content),
				options: options || {},
				data: options && options.data,
				close: (params: DynamicDialogCloseOptions) => {
					dialogEventBus.emit("close", { instance, params })
				},
			}

			dialogEventBus.emit("open", { instance })

			return instance
		},
	}

	app.config.globalProperties.$dialog = fakeService
	app.provide(PrimeVueDialogSymbol, fakeService)
}
