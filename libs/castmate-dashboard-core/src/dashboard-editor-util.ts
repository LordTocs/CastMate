import { inject } from "vue"

export function useIsEditor() {
	return inject<boolean>("isEditor", false)
}
