// Helper class for evaluating templates from the UI.
// Since templates can call functions that exist only on the main process, we can't evaluate a template in a UI process.

import { callIpcFunc, ipcFunc } from "../utils/electronBridge"
import { Watcher } from "./reactive"
import { StateManager } from "./state-manager"
import { templateSchema } from "./template"

class RemoteTemplateEvaluator {
	/**
	 *
	 * @param {String} id
	 * @param {*} schema
	 * @param {*} initialData
	 */
	constructor(id, schema, initialData) {
		this.id = id
		this.schema = schema
		this.data = initialData
		this.templatedData = null
		this.evaluate()
	}

	setData(newData) {
		this.data = newData
		this.evaluate()
	}

	async evaluate() {
		this.watcher?.unsubscribe()

		this.watcher = await Watcher.watchAsync(async () => {
			this.templatedData = await templateSchema(
				this.data,
				this.schema,
				StateManager.getInstance().getTemplateContext({})
			)
			callIpcFunc(
				"templates_updateTemplatedData",
				this.id,
				this.templatedData
			)
		})
	}

	release() {
		this.watcher?.unsubscribe()
	}
}

let remoteTemplateManager = null
export class RemoteTemplateManager {
	static getInstance() {
		if (!remoteTemplateManager) {
			remoteTemplateManager = new RemoteTemplateManager()
		}
	}

	constructor() {
		this.remoteTemplates = {}

		ipcFunc("templates", "updateData", (id, data) => {
			const evaluator = this.remoteTemplates[id]
			if (!evaluator) {
				return false
			}

			evaluator.setData(data)

			return true
		})

		ipcFunc("templates", "createEvaluator", (id, schema, initialData) => {
			if (id in this.remoteTemplates) {
				return false
			}

			this.remoteTemplates[id] = new RemoteTemplateEvaluator(
				id,
				schema,
				initialData
			)

			return true
		})

		ipcFunc("templates", "releaseEvaluator", (id) => {
			const evaluator = this.remoteTemplates[id]
			if (!evaluator) return false

			evaluator.release()

			delete this.remoteTemplates[id]
			return true
		})
	}
}
