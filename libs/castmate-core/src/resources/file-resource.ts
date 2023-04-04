import { ExtractStorageAny, RegisterResource, ResourceType } from "./resource"
import { nanoid } from "nanoid/non-secure"

interface FileResourceAnyConstructor<T> {
	new (id: string, config: any): T
}

function FileResource<T>() {
	return class extends ResourceType<T>() {
		private static _construct(id: string, config: any): T {
			const result =
				new (this as unknown as FileResourceAnyConstructor<T>)(
					id,
					config
				)
			return result
		}

		//Impossible to extract type due to improper errors in the TS compiler
		static async create(config: any) {
			const resource = this._construct(nanoid(), config)
			//SERIALIZE HERE
			return resource
		}

		static async load() {
			const allConfigs: any[] = [] //Load here
			const allResources = allConfigs.map((config) =>
				this._construct("filenamehere", config)
			)

			const storage = ExtractStorageAny(this)

			allResources.map((r) => storage.inject(r))
		}
	}
}

@RegisterResource
class TestFileResource extends FileResource<TestFileResource>() {
	config: {
		hello: string
	}
}
