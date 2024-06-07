import { AutomationConfig } from "castmate-schema"
import { FileResource } from "../resources/file-resource"
import { ResourceStorage } from "../resources/resource"
import { nanoid } from "nanoid/non-secure"

export class Automation extends FileResource<AutomationConfig> {
	static resourceDirectory: string = "./automations"
	static storage = new ResourceStorage<Automation>("Automation")

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			sequence: { actions: [] },
			floatingSequences: [],
		}

		this.state = {}
	}
}
