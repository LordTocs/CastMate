import { FileResource, ResourceStorage, definePluginResource } from "castmate-core"
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { nanoid } from "nanoid/non-secure"

export class Overlay extends FileResource<OverlayConfig> {
	static resourceDirectory: string = "./overlays"
	static storage = new ResourceStorage<Overlay>("Overlay")

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			size: { width: 1920, height: 1080 },
			widgets: [],
		}
	}
}

export function setupOverlayResources() {
	definePluginResource(Overlay)
}
