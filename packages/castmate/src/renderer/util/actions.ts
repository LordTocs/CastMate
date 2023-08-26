import { ActionSelection, ipcInvoke, useAction } from "castmate-ui-core"
import { MaybeRefOrGetter, toValue, watch, ref, computed, onMounted, isRef } from "vue"

export function useDuration(
	actionSel: MaybeRefOrGetter<ActionSelection>,
	config: MaybeRefOrGetter<Record<string, any>>,
	defaultDuration: number = 0
) {
	const action = useAction(actionSel)

	function isIPCCall(actionSelection: ActionSelection) {
		if (!action.value) return false
		if (!actionSelection.action || !actionSelection.plugin) return false

		//Flawed method, but this is an ipc call
		return action.value.durationhandler.startsWith(actionSelection.plugin)
	}

	async function getDuration() {
		if (!action.value) return defaultDuration

		const actionSelection = toValue(actionSel)
		const configData = toValue(config)

		if (isIPCCall(actionSelection)) {
			console.log("Getting Duration from main", action.value.durationhandler, configData)
			return await ipcInvoke<number>(action.value.durationhandler, configData)
		} else {
			console.log("Getting from config", action.value.durationhandler)
			return configData?.[action.value.durationhandler] ?? defaultDuration
		}
	}

	const durationStorage = ref<number>(defaultDuration)

	onMounted(async () => {
		durationStorage.value = await getDuration()
	})

	watch(
		() => {
			const actionSelection = toValue(actionSel)
			if (!action.value) return undefined

			if (isIPCCall(actionSelection)) {
				return toValue(config)
			} else {
				return toValue(config)?.[action.value.durationhandler]
			}
		},
		async (value, oldValue) => {
			if (!action.value) return
			durationStorage.value = await getDuration()
		}
	)

	return computed({
		get() {
			return durationStorage.value
		},
		set(v) {
			const actionSelection = toValue(actionSel)

			if (isRef<Record<string, any>>(config) && action.value) {
				if (!isIPCCall(actionSelection)) {
					config.value[action.value.durationhandler] = v
				}
			}
		},
	})
}
