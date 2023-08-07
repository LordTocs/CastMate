import { DialogServiceMethods } from "primevue/dialogservice"
import { inject, type Ref } from "vue"

export type DynamicDialogInstance = ReturnType<DialogServiceMethods["open"]>

export function useDialogRef() {
	return inject<Ref<DynamicDialogInstance | undefined>>("dialogRef")
}
