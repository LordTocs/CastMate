// import { Resource, ResourceBase, ResourceStorage, ResourceStorageBase } from "./resource"
import * as fs from "fs/promises"
import * as fsSync from "fs"
import * as path from "path"
import * as YAML from "yaml"
import { ensureDirectory, loadYAMLAbsolute, resolveProjectPath, writeYAML } from "../io/file-system"
import { globalLogger, usePluginLogger } from "../logging/logging"
import { ConstructedType } from "../util/type-helpers"
import { implementResource, ResourceImplementation, ResourceImplementationDesc } from "./resource"
import {
	removeKeys,
	ResourceData,
	ResourceSpecification,
	SchemaObject,
	SchemaType,
	testRes3,
	TSchemaFunctionSet,
	TSchemaProperties,
} from "castmate-schema"
import { Service } from "../util/service"

import * as chokidar from "chokidar"
import { ResourceRegistry } from "./resource-registry"

// interface FileResourceConstructor {
// 	new (...args: any[]): ResourceBase
// 	resourceDirectory: string
// }
// const logger = usePluginLogger("resources")

// export class FileResource<ConfigType extends object, StateType extends object = {}> extends Resource<
// 	ConfigType,
// 	StateType
// > {
// 	static resourceDirectory: string = ""

// 	/**
// 	 * Used to limit what part of the config is saved to file
// 	 */
// 	get savedConfig(): object {
// 		return this.config
// 	}

// 	async load(savedConfig: object): Promise<boolean> {
// 		await super.applyConfig(savedConfig) //Intentially call super here to avoid triggering a save
// 		return true
// 	}

// 	get directory() {
// 		return (this.constructor as FileResourceConstructor).resourceDirectory
// 	}

// 	get filename() {
// 		return `${this.id}.yaml`
// 	}

// 	get filepath() {
// 		return resolveProjectPath(this.directory, this.filename)
// 	}

// 	static async onCreate(resource: FileResource<any, any>) {
// 		await resource.save()
// 	}

// 	static async onDelete(resource: FileResource<any, any>) {
// 		const logger = usePluginLogger("resources")
// 		logger.log("Deleting", this.storage.name, ":", resource.config.name, resource.id)
// 		await fs.unlink(resource.filepath)
// 	}

// 	async save() {
// 		await writeYAML(this.savedConfig, this.filepath)
// 	}

// 	async applyConfig(config: Partial<ConfigType>): Promise<boolean> {
// 		await super.applyConfig(config)
// 		await this.save()
// 		return true
// 	}

// 	async setConfig(config: ConfigType): Promise<boolean> {
// 		await super.setConfig(config)
// 		await this.save()
// 		return true
// 	}

// 	static async initialize() {
// 		await super.initialize()

// 		await loadFileResources(this)
// 	}
// }

// export interface IFileResource extends ResourceBase {
// 	load(config: object): Promise<boolean>
// 	save(): Promise<any>
// }

// interface FileIshConstructor<RT extends IFileResource = IFileResource> {
// 	new (): RT
// 	storage: ResourceStorageBase
// 	resourceDirectory: string
// }

// export async function loadFileResources<T extends FileIshConstructor>(resourceConstructor: T) {
// 	if (!resourceConstructor) {
// 		throw new Error("Missing Resource Constructor!")
// 	}

// 	if (resourceConstructor.resourceDirectory == "") {
// 		throw new Error("Cannot load resources, no directory set!")
// 	}

// 	const resolvedDir = resolveProjectPath(resourceConstructor.resourceDirectory)
// 	await ensureDirectory(resolvedDir)
// 	const files = await fs.readdir(resolvedDir)

// 	const fileLoadPromises = files.map(async (file) => {
// 		const id = path.basename(file, ".yaml")

// 		logger.log("Loading", resourceConstructor.storage.name, id)

// 		const fullFile = path.join(resolvedDir, file)

// 		try {
// 			const data = await loadYAML(fullFile)
// 			const resource = new resourceConstructor()
// 			//@ts-ignore
// 			resource._id = id

// 			if ((await resource.load(data)) === false) {
// 				logger.error("Load Failed", id)
// 				return undefined
// 			}

// 			return resource
// 		} catch (err) {
// 			logger.error("Loading Resource Threw", id, err)
// 			return undefined
// 		}
// 	})

// 	//Heh typescript bug can't detect we've eliminated all undefines
// 	const resources = (await Promise.all(fileLoadPromises)).filter((r) => r != null) as ConstructedType<T>[]

// 	await resourceConstructor.storage.inject(...resources)
// }

export interface DocumentResourceConstructionData<TState extends TSchemaProperties> {
	state: SchemaType<SchemaObject<TState>>
}

// interface DocumentResourceImplementationDesc<
// 	TState extends TSchemaProperties,
// 	TConfig extends TSchemaProperties,
// 	TFunctions extends TSchemaFunctionSet
// > extends ResourceImplementationDesc<
// 		TState,
// 		TConfig,
// 		TFunctions,
// 		[id: string, name: string, config: SchemaType<SchemaObject<TConfig>>]
// 	> {
// 	fileSlug?: string
// 	create(
// 		id: string,
// 		name: string,
// 		config: SchemaType<SchemaObject<TConfig>>
// 	): Promise<DocumentResourceConstructionData<TState, TConfig>>
// }

export type DocumentResourceData<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet
> = ResourceData<TState, TConfig, TFunctions> & {
	projectPath: string
}

export interface ParsedDocumentPath {
	fullPath: string
	id: string
	slug: string
	ext: string
}

export function parseDocumentPath(filepath: string) {
	const parsedPath = path.parse(filepath)
	const parsedName = parsedPath.name.split(".")
	if (parsedName.length == 2) {
		const [id, slug] = parsedName
		//invoke slug from document resource registry
		return {
			fullPath: filepath,
			id,
			slug,
			ext: parsedPath.ext,
		} as ParsedDocumentPath
	}
	return undefined
}

export async function loadDocumentYAML(filePath: string, resource: ResourceImplementation) {
	const data = await loadYAMLAbsolute(filePath)

	const name = data.name
	//TODO: use schema validation
	if (!name || typeof name != "string") {
		throw new Error("Missing Document Name")
	}

	const config = data.config
	//TODO: use schema validation

	return {
		name,
		config,
	}
}

export const ProjectService = Service(
	class {
		private watcher: chokidar.FSWatcher | undefined = undefined
		private documentTypes = new Map<string, ResourceImplementation>()

		constructor() {
			this.setupWatcher()
		}

		private setupWatcher() {
			if (this.watcher) {
				this.watcher.close()
			}

			const projectPath = resolveProjectPath()
			this.watcher = chokidar.watch(projectPath)

			this.watcher.on("add", async (filepath, stats) => {
				const documentPath = parseDocumentPath(filepath)
				if (!documentPath) {
					//Not a document... do we also allow media in these?
					return
				}
				const resourceType = this.documentTypes.get(documentPath.slug)
				if (!resourceType) {
					throw new Error(`Unregistered Document Resource Type "${documentPath.slug}"`)
				}

				const existing = resourceType.getById(documentPath.id)
				if (existing) {
					throw new Error(`Document ID ("${documentPath.id}") already in use!`)
				}

				const data = await loadDocumentYAML(filepath, resourceType)
				const newResource = await resourceType.create(documentPath.id, data.name, data.config, filepath)
			})

			this.watcher.on("unlink", (filepath) => {
				const documentPath = parseDocumentPath(filepath)
				if (!documentPath) {
					//Not a document... do we also allow media in these?
					return
				}

				//TODO: Force update the config
			})

			this.watcher.on("change", async (filepath) => {
				const documentPath = parseDocumentPath(filepath)
				if (!documentPath) {
					//Not a document... do we also allow media in these?
					return
				}

				const resourceType = this.documentTypes.get(documentPath.slug)
				if (!resourceType) {
					throw new Error(`Unregistered Document Resource Type "${documentPath.slug}"`)
				}

				//Will no-op if it's already removed.
				await resourceType.removeResources(documentPath.id)
			})
		}
	}
)

export function implementDocumentResource<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet
>(
	spec: ResourceSpecification<TState, TConfig, TFunctions>,
	impl: DocumentResourceImplementationDesc<TState, TConfig, TFunctions>
) {
	const baseResource = implementResource(spec, {
		...impl,
		async create(id: string, name: string, config: any, projectPath: string) {
			const internalConstruct = await impl.create(id, name, config)
			const internalFixed = removeKeys(internalConstruct, ["id", "name", "config", "projectPath"])
			return {
				id,
				name,
				config,
				projectPath,
				...internalFixed,
			}
		},
		async onDelete(resource: DocumentResourceData<TState, TConfig, TFunctions>) {
			const path = resolveProjectPath(resource.projectPath)

			if (fsSync.existsSync(path)) {
				await fs.unlink(path)
			}

			await impl.onDelete?.(resource)
		},
		async onCreate(resource) {
			await impl.onCreate?.(resource)
		},
	})

	return baseResource
}

implementDocumentResource(testRes3, {
	async create(id, name, config) {
		return {
			state: {
				a: 10,
			},
		}
	},
	functions: {},
})
