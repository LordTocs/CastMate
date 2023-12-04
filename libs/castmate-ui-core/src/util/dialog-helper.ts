import { DialogServiceMethods } from "primevue/dialogservice"
import { inject, type Ref, computed } from "vue"

export type DynamicDialogInstance = ReturnType<DialogServiceMethods["open"]>

export function useDialogRef() {
	return inject<Ref<DynamicDialogInstance | undefined>>(
		"dialogRef",
		computed(() => undefined)
	)
}
