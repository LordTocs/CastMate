import { Resource, ResourceBase, ResourceStorage, ResourceStorageBase } from "./resource"
import * as fs from "fs/promises"
import * as path from "path"
import { ensureDirectory, loadYAML, resolveProjectPath, writeYAML } from "../io/file-system"
import { globalLogger, usePluginLogger } from "../logging/logging"
import { ConstructedType } from "../util/type-helpers"

interface FileResourceConstructor {
	new (...args: any[]): ResourceBase
	resourceDirectory: string
}
const logger = usePluginLogger("resources")

export class FileResource<ConfigType extends object, StateType extends object = {}> extends Resource<
	ConfigType,
	StateType
> {
	static resourceDirectory: string = ""

	/**
	 * Used to limit what part of the config is saved to file
	 */
	get savedConfig(): object {
		return this.config
	}

	async load(savedConfig: object): Promise<boolean> {
		await super.applyConfig(savedConfig) //Intentially call super here to avoid triggering a save
		return true
	}

	get directory() {
		return (this.constructor as FileResourceConstructor).resourceDirectory
	}

	get filename() {
		return `${this.id}.yaml`
	}

	get filepath() {
		return resolveProjectPath(this.directory, this.filename)
	}

	static async onCreate(resource: FileResource<any, any>) {
		await resource.save()
	}

	static async onDelete(resource: FileResource<any, any>) {
		const logger = usePluginLogger("resources")
		logger.log("Deleting", this.storage.name, ":", resource.config.name, resource.id)
		await fs.unlink(resource.filepath)
	}

	async save() {
		await writeYAML(this.savedConfig, this.filepath)
	}

	async applyConfig(config: Partial<ConfigType>): Promise<boolean> {
		await super.applyConfig(config)
		await this.save()
		return true
	}

	async setConfig(config: ConfigType): Promise<boolean> {
		await super.setConfig(config)
		await this.save()
		return true
	}

	static async initialize() {
		await super.initialize()

		await loadFileResources(this)
	}
}

export interface IFileResource extends ResourceBase {
	load(config: object): Promise<boolean>
	save(): Promise<any>
}

interface FileIshConstructor<RT extends IFileResource = IFileResource> {
	new (): RT
	storage: ResourceStorageBase
	resourceDirectory: string
}

export async function loadFileResources<T extends FileIshConstructor>(resourceConstructor: T) {
	if (!resourceConstructor) {
		throw new Error("Missing Resource Constructor!")
	}

	if (resourceConstructor.resourceDirectory == "") {
		throw new Error("Cannot load resources, no directory set!")
	}

	const resolvedDir = resolveProjectPath(resourceConstructor.resourceDirectory)
	await ensureDirectory(resolvedDir)
	const files = await fs.readdir(resolvedDir)

	const fileLoadPromises = files.map(async (file) => {
		const id = path.basename(file, ".yaml")

		logger.log("Loading", resourceConstructor.storage.name, id)

		const fullFile = path.join(resolvedDir, file)

		try {
			const data = await loadYAML(fullFile)
			const resource = new resourceConstructor()
			//@ts-ignore
			resource._id = id

			if ((await resource.load(data)) === false) {
				logger.error("Load Failed", id)
				return undefined
			}

			return resource
		} catch (err) {
			logger.error("Loading Resource Threw", id, err)
			return undefined
		}
	})

	//Heh typescript bug can't detect we've eliminated all undefines
	const resources = (await Promise.all(fileLoadPromises)).filter((r) => r != null) as ConstructedType<T>[]

	await resourceConstructor.storage.inject(...resources)
}
