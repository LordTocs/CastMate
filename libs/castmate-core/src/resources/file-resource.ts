import { Resource, ResourceBase } from "./resource"
import * as fs from "fs/promises"
import * as path from "path"
import { ensureDirectory, loadYAML, resolveProjectPath, writeYAML } from "../io/file-system"

interface FileResourceConstructor {
	new (...args: any[]): ResourceBase
	resourceDirectory: string
}

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
		console.log("Deleting!", resource.id)
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

		if (this.resourceDirectory == "") {
			throw new Error("Cannot load resources, no directory set!")
		}

		console.log("Loading Resources from ", this.resourceDirectory)

		const resolvedDir = resolveProjectPath(this.resourceDirectory)
		await ensureDirectory(resolvedDir)
		const files = await fs.readdir(resolvedDir)

		const fileLoadPromises = files.map(async (file) => {
			const id = path.basename(file, ".yaml")

			console.log("Loading", this.storage.name, id)

			const fullFile = path.join(resolvedDir, file)

			try {
				const data = await loadYAML(fullFile)
				const resource = new this()
				resource._id = id

				if ((await resource.load(data)) === false) {
					console.error("Load Failed", id)
					return undefined
				}

				return resource
			} catch (err) {
				console.error("Load Errored", id, err)
				return undefined
			}
		})

		//Heh typescript bug can't detect we've eliminated all undefines
		const resources = (await Promise.all(fileLoadPromises)).filter((r) => r != null) as ResourceBase[]

		await this.storage.inject(...resources)
	}
}
