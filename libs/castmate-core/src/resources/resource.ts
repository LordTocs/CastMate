import _cloneDeep from "lodash/cloneDeep"
import { ReactiveEffect, ReactiveGet, ReactiveSet, autoRerun, rawify } from "../reactivity/reactivity"
import { ResourceRegistry } from "./resource-registry"
import { defineCallableIPC } from "../util/electron"
import {
	AsyncSchemaFunctionSetType,
	AsyncSchemaFuncType,
	mapKeys,
	MaybePromise,
	ResourceConstructionData,
	ResourceData,
	ResourceDataBase,
	ResourceSpecification,
	SchemaFunctionSetType,
	SchemaObject,
	SchemaType,
	testRes,
	TSchemaFunctionSet,
	TSchemaProperties,
} from "castmate-schema"
import { isObject } from "../util/type-helpers"
import { globalLogger, usePluginLogger } from "../logging/logging"
import { onLoad } from "../plugins/plugin"
import { PluginManager } from "../plugins/plugin-manager"
import assert from "node:assert"

export interface ResourceImplementation<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet,
	TCreateArgs extends any[]
> {
	spec: ResourceSpecification<TState, TConfig, TFunctions>
	impl: ResourceImplementationDesc<TState, TConfig, TFunctions, TCreateArgs>
	getById(id: string): Resource<TState, TConfig, TFunctions> | undefined
	removeResources(...ids: string[]): Promise<void>
	[Symbol.iterator](): Generator<Resource<TState, TConfig, TFunctions>>
	create(...args: TCreateArgs): Promise<Resource<TState, TConfig, TFunctions>>
}

export type ResourceType = ResourceImplementation<TSchemaProperties, TSchemaProperties, TSchemaFunctionSet, any[]>

export type ResourceImplementationDesc<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet,
	TCreateArgs extends any[]
> = {
	onDelete?(resource: Resource<TState, TConfig, TFunctions>): MaybePromise<void>
	onCreate?(resource: Resource<TState, TConfig, TFunctions>): MaybePromise<void>
	create(...args: TCreateArgs): Promise<ResourceConstructionData<TState, TConfig>>

	functions: AsyncSchemaFunctionSetType<TFunctions, ResourceData<TState, TConfig, TFunctions>>
}

export type Resource<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet,
	TRes = { plugin: string; typeId: string } & ResourceConstructionData<TState, TConfig> &
		AsyncSchemaFunctionSetType<TFunctions>
> = TRes

export function implementResource<
	TState extends TSchemaProperties,
	TConfig extends TSchemaProperties,
	TFunctions extends TSchemaFunctionSet,
	TCreateArgs extends any[]
>(
	spec: ResourceSpecification<TState, TConfig, TFunctions>,
	impl: ResourceImplementationDesc<TState, TConfig, TFunctions, TCreateArgs>
): ResourceImplementation<TState, TConfig, TFunctions, TCreateArgs> {
	const logger = usePluginLogger(spec.plugin)
	//logger.log("Implementing Resource", spec.id)
	console.log("Implementing Resource", spec.id)

	const storage = new Map<string, Resource<TState, TConfig, TFunctions>>()

	const result = {
		spec,
		impl,
		getById(id) {
			return storage.get(id)
		},
		*[Symbol.iterator]() {
			for (const r of storage.values()) {
				yield r
			}
		},
		async removeResources(...ids) {
			for (const id of ids) {
				const r = this.getById(id)
				if (r != null) {
					await impl.onDelete?.(r) //TODO: Error handle
					storage.delete(id)
				}
			}
		},
		async create(...args) {
			const data = await impl.create(...args)
			return {
				...data,
				plugin: spec.plugin,
				typeId: spec.id,
				...impl.functions,
			} as Resource<TState, TConfig, TFunctions>
		},
	} as ResourceImplementation<TState, TConfig, TFunctions, TCreateArgs>

	const plugin = PluginManager.getInstance().getPlugin(spec.plugin)
	assert(plugin)

	onLoad(() => {
		//@ts-expect-error
		ResourceRegistry.getInstance().registerResource(result)
	}, plugin)

	return result
}

// const TestRes2 = implementResource(testRes, {
// 	async create(value: string) {
// 		return {
// 			id: "blah",
// 			name: "blarg",
// 			state: {
// 				a: 10,
// 			},
// 			config: {
// 				b: "string",
// 			},
// 			blah: 10,
// 		}
// 	},
// 	async onDelete(resource) {},
// 	functions: {
// 		async testFunc(a, b) {
// 			return ""
// 		},
// 	},
// })

// const t2 = TestRes2.getById("")

// const t3 = await TestRes2.create("BLORG")

// t3.testFunc(10, "")

// interface ITest {
// 	a: string
// 	b: number
// }

// function testF<T extends ITest>(f: T) {}

// testF({
// 	a: "hello",
// 	b: 10,
// 	hello: false,
// })
