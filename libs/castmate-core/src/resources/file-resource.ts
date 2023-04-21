import { SchemaObj, SchemaType } from "../data/schema"
import {
	ResourceSpec,
	defineResource,
	ExtractStorageAny,
	ResourceConstructor,
	RegisterResource,
	ResourceStorage,
	Resource,
	ResourceConfig,
} from "./resource"
import * as fs from "fs/promises"
import * as path from "path"
import { nanoid } from "nanoid/non-secure"
import * as YAML from "yaml"

export async function saveResource<T extends Resource>(r: T, folder: string) {
	await fs.writeFile(path.join(folder, `${r.id}.yaml`), YAML.stringify(r.config), "utf-8")
	return r
}

export async function loadResource<TConstructor extends ResourceConstructor>(
	constructor: TConstructor,
	file: string
): Promise<InstanceType<TConstructor>> {
	const strData = await fs.readFile(file, "utf-8")
	const data = YAML.parse(strData)
	const id = path.basename(file, ".yaml")
	return new constructor(id, data)
}

export async function loadResources<TConstructor extends ResourceConstructor>(
	constructor: TConstructor,
	folder: string
) {
	const dir = await fs.readdir(folder)

	return await Promise.all(dir.map((v) => loadResource(constructor, path.join(folder, v))))
}
