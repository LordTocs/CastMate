import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	usePluginLogger,
	ensureDirectory,
	resolveProjectPath,
	sleep,
} from "castmate-core"

import { Environment, Logger, StorageBackendMemory, StorageContext, StorageService, Network } from "@matter/general"
import { CommissioningController } from "@project-chip/matter.js"
import { nanoid } from "nanoid/non-secure"
import { ControllerStore, ServerNode } from "@matter/main"
import { initializeMatterEnvironment } from "./matter-controller"
import { ControllerCommissioningFlowOptions } from "@matter/main/protocol"
import { GeneralCommissioning } from "@matter/main/model"
import Crypto from "node:crypto"

export default definePlugin(
	{
		id: "matter",
		name: "Matter",
		description: "Integration for open smart home standard. Matter.",
		icon: "mdi-pencil",
	},
	() => {
		//Plugin Intialization
		const logger = usePluginLogger()

		const environment = Environment.default

		onLoad(async () => {
			logger.log("Initializing Controller Store")

			await ensureDirectory(resolveProjectPath("matter", "storage"))

			await initializeMatterEnvironment(environment)

			logger.log("Crypto Ciphers", Crypto.getCiphers())

			const node = await ServerNode.create()

			//node.behaviors.createAsync()

			await node.start()

			for (const behavior of node.behaviors) {
				logger.log(behavior)
			}

			// //await controller.initializeControllerStore()

			// const storageService = environment.get(StorageService)

			// const castmateDataContext = (await storageService.open("castmate_controller")).createContext("data")

			// let controllerId: string

			// if (await castmateDataContext.has("id")) {
			// 	controllerId = await castmateDataContext.get<string>("id")
			// } else {
			// 	controllerId = nanoid()
			// 	await castmateDataContext.set("id", controllerId)
			// }

			// let longDescriminator = await castmateDataContext.get<number>("longDescriminator", 3841)
			// let pin = await castmateDataContext.get<number>("pin", 20202021)

			// const controller = new CommissioningController({
			// 	environment: {
			// 		environment,
			// 		id: controllerId,
			// 	},
			// 	autoConnect: false,
			// 	adminFabricLabel: "CastMate Controller",
			// })

			// //const controllerStore = environment.get(ControllerStore)
			// //const storageContext = controllerStore.storage.createContext("Node")

			// logger.log("Starting CommissioningController")
			// await controller.start()

			// logger.log("Started Controller!")
			// logger.log("Session Info", controller.getActiveSessionInformation())

			// if (!controller.isCommissioned()) {
			// 	logger.log("No nodes commissioned??")
			// 	const commissioningOptions: ControllerCommissioningFlowOptions = {
			// 		//@ts-ignore
			// 		regulatoryLocation: 2, //GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
			// 		regulatoryCountryCode: "xx",
			// 	}

			// 	const nodeId = await controller.commissionNode({
			// 		commissioning: commissioningOptions,
			// 		discovery: {
			// 			identifierData: { longDescriminator },
			// 			discoveryCapabilities: {
			// 				onIpNetwork: true,
			// 			},
			// 		},
			// 		passcode: pin,
			// 	})

			// 	logger.log("Commisioned", nodeId)
			// }

			// const nodes = controller.getCommissionedNodes()
			// logger.log("All the nodes", nodes)

			// await sleep(30 * 1000)

			// const nodes2 = controller.getCommissionedNodes()
			// logger.log("All the nodes", nodes2)
		})
	}
)
