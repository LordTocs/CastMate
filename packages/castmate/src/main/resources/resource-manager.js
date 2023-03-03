import { ipcFunc } from "../utils/electronBridge"
import logger from "../utils/logger"

export class ResourceManager {
	constructor() {
		this.resources = []

		ipcFunc("resourceManager", "getResourceTypes", () => {
			return this.resources.map((r) => r.toIpcDescription())
		})
	}

	static getInstance() {
		return resourceManager
	}

	registerResource(resource) {
		console.log("Registering", resource.name)
		this.resources.push(resource)
	}

	async initialize() {
		await Promise.all(
			this.resources.map((r) =>
				r
					.load()
					.catch((err) =>
						logger.error(`Error loading resource ${r.name}`)
					)
			)
		)
	}
}

let resourceManager = new ResourceManager()
