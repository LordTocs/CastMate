// import { Resource, ResourceBase, ResourceStorage, ResourceStorageBase } from "./resource"
import * as fs from "fs/promises"
import * as fsSync from "fs"
import * as path from "path"
import * as YAML from "yaml"
import { ensureDirectory, loadYAMLAbsolute, resolveProjectPath, writeYAML } from "../io/file-system"
import { globalLogger, usePluginLogger } from "../logging/logging"
import { ConstructedType } from "../util/type-helpers"
import { implementResource, Resource, ResourceImplementation, ResourceImplementationDesc } from "./resource"
import {
	AsyncSchemaFunctionSetType,
	MaybePromise,
	removeKeys,
	ResourceConstructionData,
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

export async function loadDocumentYAML<TConfig extends TSchemaProperties>(
	filePath: string,
	resource: ResourceImplementation<TSchemaProperties, TConfig, TSchemaFunctionSet, any[]>
) {
	const data = await loadYAMLAbsolute(filePath)

	const name = data.name
	//TODO: use schema validation
	if (!name || typeof name != "string") {
		throw new Error("Missing Document Name")
	}

	const config = data.config as SchemaType<SchemaObject<TConfig>>
	//TODO: use schema validation

	return {
		name,
		config,
	}
}

export const ProjectService = Service(
	class {
		private watcher: chokidar.FSWatcher | undefined = undefined
		private documentTypes = new Map<
			string,
			ResourceImplementation<TSchemaProperties, TSchemaProperties, TSchemaFunctionSet, any[]>
		>()

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

export type DocumentResourceImplementationDesc<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet
> = {
	onDelete?(resource: Resource<TState, TConfig, TFunctions>): MaybePromise<void>
	onCreate?(resource: Resource<TState, TConfig, TFunctions>): MaybePromise<void>
	create(
		id: string,
		name: string,
		config: SchemaType<SchemaObject<TConfig>>
	): Promise<DocumentResourceConstructionData<TState>>

	functions: AsyncSchemaFunctionSetType<TFunctions, ResourceData<TState, TConfig, TFunctions>>
}

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
