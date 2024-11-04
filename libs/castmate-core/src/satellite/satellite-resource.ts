import { isAsyncFunction } from "util/types"
import {
	Resource,
	ResourceBase,
	ResourceConstructor,
	ResourceStorage,
	ResourceStorageBase,
} from "../resources/resource"
import { SatelliteService } from "./satellite-service"
import { Service } from "../util/service"
import { nanoid } from "nanoid/non-secure"
import _pushUnique from "lodash/"
import { onLoad, onUnload } from "../plugins/plugin"
import { defineCallableIPC, defineIPCFunc } from "../util/electron"
import { ResourceRegistry } from "../resources/resource-registry"
import { usePluginLogger } from "../logging/logging"

class TestResource extends Resource<{ blah: string }> {
	static storage = new ResourceStorage<TestResource>("TestResource")

	async foo(bar: string) {
		return 10
	}

	async blah() {}
}

type KeysMatching<T, V> = { [K in keyof T]-?: T[K] extends V ? K : never }[keyof T]

type SatelliteResourceFunctionKeys<T extends Resource<any>> = KeysMatching<
	Omit<T, keyof Resource<any>>,
	(...args: any[]) => Promise<any>
>

export const SatelliteResourceSymbol = Symbol()

export type SatelliteResourceConstructor = ResourceConstructor & { [SatelliteResourceSymbol]: any }

interface RemoteSatelliteResourceSlot {
	id: string
	resourceType: string
	resource: Resource<any>
	connections: Set<string>
	name: string
}

interface SatelliteResourceSlotBinding<T extends ResourceBase = ResourceBase> {
	id: string
	resourceType: string
	resource?: T
	name: string
}

//Local to Satellite redirects to actual Resource
interface SatelliteResourceSlotHandler<T extends ResourceBase = ResourceBase> {
	satelliteConstructor: SatelliteResourceConstructor
	rpcs: {
		[rpcName: string]: (resource: T, ...args: any[]) => Promise<any>
	}
}

const logger = usePluginLogger("satellite")

export const SatelliteResources = Service(
	class {
		//Remote Satellite Resources represented in CastMate
		private remoteSlots = new Map<string, RemoteSatelliteResourceSlot>()
		private slotHandlers = new Map<string, SatelliteResourceSlotHandler>()
		private slotBindings = new Map<string, SatelliteResourceSlotBinding>()

		constructor(private mode: "castmate" | "satellite") {
			if (mode == "castmate") {
				SatelliteService.getInstance().registerRPC(
					"satellite_resourceBind",
					(connection: string, slotId: string) => {
						logger.log("Remote Slot", slotId, "Bound on Connection", connection)
						this.remoteSlots.get(slotId)?.connections.add(connection)
					}
				)

				SatelliteService.getInstance().registerRPC(
					"satellite_resourceUnbind",
					(connection: string, slotId: string) => {
						logger.log("Remote Slot", slotId, "Unbound on Connection", connection)
						this.remoteSlots.get(slotId)?.connections.delete(connection)
					}
				)

				SatelliteService.getInstance().onDisconnected.register((satelliteId) => {
					for (const slot of this.remoteSlots.values()) {
						slot.connections.delete(satelliteId)
					}
				})
			} else {
				SatelliteService.getInstance().registerRPC(
					"satellite_resourceRPC",
					async (connection: string, slotId: string, name: string, ...args: any[]) => {
						const binding = this.slotBindings.get(slotId)
						if (!binding) return
						const handler = this.slotHandlers.get(binding.resourceType)
						if (!handler) return
						if (!binding.resource) return

						logger.log("Received Satellite Resource RPC", slotId, name, ...args)
						logger.log("    Calling On", binding.resource.config.name, binding.resource.id)
						return await handler.rpcs[name](binding.resource, ...args)
					}
				)

				defineIPCFunc("satellite", "createSlotBinding", (slotId: string, type: string, name: string) => {
					this.createSlotBinding(slotId, type, name)
				})

				defineIPCFunc("satellite", "deleteSlotBinding", (slotId: string) => {
					this.deleteSlotBinding(slotId)
				})

				defineIPCFunc(
					"satellite",
					"bindResourceSlot",
					async (slotId: string, resourceId: string | undefined) => {
						const slot = this.slotBindings.get(slotId)

						if (!slot) throw new Error("Unknown Slot!")

						const resourceType = ResourceRegistry.getInstance().getResourceType(slot.resourceType)

						if (resourceId) {
							const resource = resourceType.storage.getById(resourceId)

							if (!resource) return

							await this.bindResourceSlot(slotId, resource)
						} else {
							await this.unbindResourceSlot(slotId)
						}
					}
				)
			}

			defineIPCFunc("satellite", "getSatelliteResourceSlotHandlerTypes", async () => {
				return [...this.slotHandlers.values()].map((sh) => {
					return sh.satelliteConstructor.storage.name
				})
			})
		}

		getResourceSlot(id: string) {
			return this.remoteSlots.get(id)
		}

		async enforceRemoteSlotName(slotId: string, name: string) {
			const slot = this.remoteSlots.get(slotId)
			if (!slot) return
			if (slot.name == name) return

			slot.name = name
			await slot.resource.applyConfig({ name })
		}

		async createRemoteResourceSlot(id: string, resourceType: string, name: string) {
			if (this.mode != "castmate") throw new Error("This is CastMate side only")
			const handler = this.getSlotHandler(resourceType)

			if (!handler) throw new Error("Creating Remote Slot for unknown Remote Resource")

			logger.log("Create Remote Slot", id, resourceType, name)

			const resource = new handler.satelliteConstructor()
			resource._id = id
			resource._config.name = name

			this.remoteSlots.set(id, {
				id,
				resource,
				resourceType,
				connections: new Set(),
				name,
			})

			await handler.satelliteConstructor.storage.inject(resource)

			return id
		}

		async deleteRemoteResourceSlot(id: string) {
			if (this.mode != "castmate") throw new Error("This is CastMate side only")

			const slot = this.remoteSlots.get(id)
			if (!slot) return

			logger.log("Delete Remote Slot", id, slot.resourceType, slot.name)

			const handler = this.getSlotHandler(slot.resourceType)

			await handler?.satelliteConstructor.storage.remove(id)

			this.remoteSlots.delete(id)
		}

		async callResourceRPC(slotId: string, name: string, ...args: any[]) {
			if (this.mode != "castmate") throw new Error("This is CastMate side only")

			const slot = this.remoteSlots.get(slotId)
			if (!slot) return

			const promises = [...slot.connections].map((c) =>
				SatelliteService.getInstance().callSatelliteRPC(c, "satellite_resourceRPC", slotId, name, ...args)
			)

			const result = await Promise.allSettled(promises)
		}

		registerSlotHandler<T extends ResourceConstructor>(
			constructor: T,
			handler: SatelliteResourceSlotHandler<InstanceType<T>>
		) {
			this.slotHandlers.set(constructor.storage.name, handler)
		}

		unregisterSlotHandler<T extends ResourceConstructor>(constructor: T) {
			this.slotHandlers.delete(constructor.storage.name)
		}

		getSlotHandler(typeName: string) {
			return this.slotHandlers.get(typeName)
		}

		createSlotBinding(slotId: string, type: string, name: string) {
			logger.log("Slot Binding Created", slotId, type, name)
			this.slotBindings.set(slotId, {
				id: slotId,
				resourceType: type,
				name,
			})
		}

		deleteSlotBinding(slotId: string) {
			logger.log("Slot Deleted", slotId)
			this.slotBindings.delete(slotId)
		}

		async bindResourceSlot<T extends ResourceBase>(slotId: string, resource: T) {
			if (this.mode != "satellite") throw new Error("This is satellite only")

			const slot = this.slotBindings.get(slotId)

			if (!slot) return

			slot.resource = resource

			const connnectionId = SatelliteService.getInstance().getCastMateConnection()

			if (connnectionId) {
				logger.log("Binding", resource.config.name, resource.id, "to slot", slot.id, slot.name)
				await SatelliteService.getInstance().callSatelliteRPC(connnectionId, "satellite_resourceBind", slotId)
			}
		}

		async unbindResourceSlot(slotId: string) {
			if (this.mode != "satellite") throw new Error("This is satellite only")

			const slot = this.slotBindings.get(slotId)

			if (!slot) return

			slot.resource = undefined

			const connnectionId = SatelliteService.getInstance().getCastMateConnection()

			if (connnectionId) {
				logger.log("Unbinding", slot.id, slot.name)
				await SatelliteService.getInstance().callSatelliteRPC(connnectionId, "satellite_resourceUnbind", slotId)
			}
		}
	}
)

export function defineSatelliteResourceSlotHandler<T extends ResourceConstructor>(
	constructor: T,
	handler: SatelliteResourceSlotHandler<InstanceType<T>>
) {
	onLoad(() => {
		SatelliteResources.getInstance().registerSlotHandler(constructor, handler)
	})

	onUnload(() => {
		SatelliteResources.getInstance().unregisterSlotHandler(constructor)
	})
}
