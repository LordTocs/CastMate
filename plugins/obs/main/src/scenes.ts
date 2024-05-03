import { ReactiveRef, defineAction } from "castmate-core"
import { OBSConnection } from "./connection"

export function setupScenes(obsDefault: ReactiveRef<OBSConnection>) {
	defineAction({
		id: "scene",
		name: "Change Scene",
		description: "Changes the current scene in OBS",
		icon: "mdi mdi-swap-horizontal-bold",
		config: {
			type: Object,
			properties: {
				obs: {
					type: OBSConnection,
					name: "OBS Connection",
					required: true,
					default: () => obsDefault.value,
				},
				scene: {
					type: String,
					name: "Scene",
					required: true,
					//template: true,
					async enum(context: { obs: OBSConnection }) {
						return (await context?.obs?.getSceneNames()) ?? []
					},
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			if (!config.obs) return
			await config.obs.connection.call("SetCurrentProgramScene", { sceneName: config.scene })
		},
	})

	defineAction({
		id: "prevScene",
		name: "Previous Scene",
		description: "Go back to the previous scene.",
		icon: "mdi mdi-skip-backward",
		config: {
			type: Object,
			properties: {
				obs: {
					type: OBSConnection,
					name: "OBS Connection",
					required: true,
					default: () => obsDefault.value,
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			if (!config.obs) return
			await config.obs.popScene()
		},
	})
}
