import { IPCDurationState, IPCInstantDurationState, getByPath } from "castmate-schema"
import { ActionSelection, ipcInvoke, useAction } from "../main"
import { MaybeRefOrGetter, toValue, watch, ref, computed, onMounted, isRef } from "vue"

export function useDuration(
	actionSel: MaybeRefOrGetter<ActionSelection | undefined>,
	config: MaybeRefOrGetter<Record<string, any>>
) {
	const action = useAction(actionSel)

	const durationConfig = computed(() => {
		const instantDefault = {
			dragType: "instant",
		} as IPCInstantDurationState

		if (!action.value) return instantDefault

		if (action.value.type == "regular") {
			return action.value.duration
		}

		return instantDefault
	})

	const ipcStateStorage = ref<IPCDurationState>({
		dragType: "instant",
	} as IPCInstantDurationState)

	const durationState = computed<IPCDurationState>(() => {
		if ("ipcCallback" in durationConfig.value) {
			return ipcStateStorage.value as IPCDurationState
		} else {
			return durationConfig.value as IPCDurationState
		}
	})

	async function updateIpcStorage() {
		if (!("ipcCallback" in durationConfig.value)) return
		ipcStateStorage.value = await ipcInvoke<IPCDurationState>(durationConfig.value.ipcCallback, toValue(config))
	}

	onMounted(async () => {
		updateIpcStorage()
	})

	watch(
		() => {
			if (!("ipcCallback" in durationConfig.value)) return

			const configValue = toValue(config)

			return durationConfig.value.propDependencies.map((dep) => getByPath(configValue, dep))
		},
		async (value, oldValue) => {
			await updateIpcStorage()
		}
	)

	return durationState
}

/*

	const length = computed<number>(() => {
		if (durationState.value.dragType == "instant") {
			return 0
		} else if (durationState.value.dragType == "fixed") {
			return durationState.value.duration
		} else if (durationState.value.dragType == "length") {
			return getByPath(toValue(config), durationState.value.rightSlider.sliderProp)
		} else if (durationState.value.dragType == "crop") {
			let leftCrop: number | undefined
			const configValue = toValue(config)
			if (durationState.value.leftSlider) {
				leftCrop = getByPath(configValue, durationState.value.leftSlider.sliderProp)
			}
			let rightCrop: number | undefined
			if (durationState.value.rightSlider) {
				rightCrop = getByPath(configValue, durationState.value.rightSlider.sliderProp)
			}

			if (leftCrop != null && rightCrop != null) {
				return rightCrop - leftCrop
			} else if (leftCrop != null) {
				return durationState.value.duration - leftCrop
			} else if (rightCrop != null) {
				return durationState.value.duration - rightCrop
			} else {
				return durationState.value.duration
			}
		}
	})
	*/
