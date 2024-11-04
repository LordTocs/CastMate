import { ReactiveRef, defineAction, registerSchemaTemplate, templateNumber, usePluginLogger } from "castmate-core"
import {
	OBSSourceTransform,
	ResolvedOBSSourceTransform,
	createEmptyOBSSourceTransform,
	transformToOBSWS,
} from "castmate-plugin-obs-shared"
import { OBSConnection } from "./connection"

export function setupTransforms(obsDefault: ReactiveRef<OBSConnection>) {
	const logger = usePluginLogger()

	defineAction({
		id: "transform",
		name: "Source Transform",
		icon: "mdi mdi-move-resize",
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
					required: true,
					name: "Scene",
					async enum(context: { obs: OBSConnection }) {
						return (await context?.obs?.getSceneAndGroupNames()) ?? []
					},
				},
				source: {
					type: Number,
					name: "Source",
					required: true,
					async enum(context: { obs: OBSConnection; scene: string }) {
						if (!context.obs) return []

						return await context.obs.getSceneSources(context.scene)
					},
				},
				transform: {
					type: OBSSourceTransform,
					name: "Transform",
					required: true,
					template: true,
					default: OBSSourceTransform.factoryCreate(),
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			const obsTransform = transformToOBSWS(config.transform)
			logger.log("Sending Transform", obsTransform)

			await config.obs.connection.call("SetSceneItemTransform", {
				sceneName: config.scene,
				sceneItemId: config.source,
				sceneItemTransform: obsTransform,
			})
		},
	})
}

registerSchemaTemplate(OBSSourceTransform, async (value, context, schema) => {
	const result: ResolvedOBSSourceTransform = createEmptyOBSSourceTransform()

	if (value.position.x != null) {
		result.position.x = await templateNumber(value.position.x, context)
	}

	if (value.position.y != null) {
		result.position.y = await templateNumber(value.position.y, context)
	}

	if (value.rotation != null) {
		result.rotation = await templateNumber(value.rotation, context)
	}

	if (value.scale.x != null) {
		result.scale.x = await templateNumber(value.scale.x, context)
	}

	if (value.scale.y != null) {
		result.scale.y = await templateNumber(value.scale.y, context)
	}

	if (value.crop.top != null) {
		result.crop.top = await templateNumber(value.crop.top, context)
	}

	if (value.crop.right != null) {
		result.crop.right = await templateNumber(value.crop.right, context)
	}

	if (value.crop.bottom != null) {
		result.crop.bottom = await templateNumber(value.crop.bottom, context)
	}

	if (value.crop.left != null) {
		result.crop.left = await templateNumber(value.crop.left, context)
	}

	if (value.boundingBox.boxType != null) {
		result.boundingBox.boxType = value.boundingBox.boxType
	}

	if (value.boundingBox.alignment != null) {
		result.boundingBox.alignment = value.boundingBox.alignment
	}

	if (value.boundingBox.width != null) {
		result.boundingBox.width = await templateNumber(value.boundingBox.width, context)
	}

	if (value.boundingBox.height != null) {
		result.boundingBox.height = await templateNumber(value.boundingBox.height, context)
	}

	return result
})
