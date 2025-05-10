import {
	Environment,
	Logger,
	StorageBackendMemory,
	StorageContext,
	StorageService,
	Network,
	StorageManager,
	Storage,
	Crypto,
	CRYPTO_SYMMETRIC_KEY_LENGTH,
	UdpInterface,
} from "@matter/general"
import {
	DeviceAdvertiser,
	ScannerSet,
	ClusterClient,
	FabricManager,
	Fabric,
	FabricBuilder,
	DEFAULT_ADMIN_VENDOR_ID,
	DEFAULT_FABRIC_ID,
	CertificateAuthority,
	SessionManager,
	ExchangeManager,
	SubscriptionClient,
	MdnsBroadcaster,
	MdnsService,
	PeerSet,
	PeerAddressStore,
} from "@matter/protocol"

const DEFAULT_FABRIC_INDEX = FabricIndex(1)
const CONTROLLER_CONNECTIONS_PER_FABRIC_AND_NODE = 3
const CONTROLLER_MAX_PATHS_PER_INVOKE = 10

const logger = usePluginLogger("matter")

import { NodeJsNetwork, StorageBackendJsonFile } from "@matter/nodejs"
import { ServerNode } from "@matter/node"
import { ensureDirectory, resolveProjectPath, usePluginLogger } from "castmate-core"
import { FabricId, FabricIndex, NodeId } from "@matter/main"

export async function initializeMatterEnvironment(environment: Environment) {
	const storageService = environment.get(StorageService)
	await ensureDirectory(resolveProjectPath("matter"))
	const storageJsonPath = resolveProjectPath("matter", "storage.json")
	storageService.factory = (namespace) => new StorageBackendJsonFile(storageJsonPath)

	const storageManager = await storageService.open("castmate-matter-storage")
	environment.set(StorageManager, storageManager)

	await initMatterNetwork(environment)

	//await initializeMatterFabric(environment)

	//await initMatterExchangeManager(environment)

	//await initMatterMDNS(environment)

	//await initMatterPeerSet(environment)
}

async function initializeMatterFabric(environment: Environment) {
	const ca = environment.get(CertificateAuthority)
	const fabricManager = environment.get(FabricManager)
	await fabricManager.construction

	if (fabricManager.fabrics.length == 0) {
		const controllerNodeId = NodeId.randomOperationalNodeId()
		const ipkValue = Crypto.get().getRandomData(CRYPTO_SYMMETRIC_KEY_LENGTH)

		const adminFabricId = FabricId(DEFAULT_FABRIC_ID)
		const adminFabricIndex = FabricIndex(DEFAULT_FABRIC_INDEX)

		const fabricBuilder = new FabricBuilder()
			.setRootCert(ca.rootCert)
			.setRootNodeId(controllerNodeId)
			.setIdentityProtectionKey(ipkValue)
			.setRootVendorId(DEFAULT_ADMIN_VENDOR_ID)
			.setLabel("CastMate Matter Controller")

		fabricBuilder.setOperationalCert(
			ca.generateNoc(
				fabricBuilder.publicKey,
				adminFabricId,
				controllerNodeId
				//caseAuthenticatedTags
			)
		)

		const fabric = await fabricBuilder.build(adminFabricIndex)
		fabricManager.addFabric(fabric)
	}
}

async function initMatterExchangeManager(environment: Environment) {
	const exchangeManager = environment.get(ExchangeManager)
	const subscriptionClient = environment.get(SubscriptionClient)

	exchangeManager.addProtocolHandler(subscriptionClient)
}

async function initMatterNetwork(environment: Environment) {
	const network = environment.get(Network)

	//const udp = await UdpInterface.create(network, "udp6")
	//environment.set(UdpInterface, udp)
}

async function initMatterMDNS(environment: Environment) {
	const deviceAdvertiser = environment.get(DeviceAdvertiser)
	const mdns = environment.get(MdnsService)
	await mdns.construction

	const udp = environment.get(UdpInterface)
	const scanners = environment.get(ScannerSet)

	deviceAdvertiser.addBroadcaster(mdns.createInstanceBroadcaster(udp.port))
	scanners.add(mdns.scanner)
}

async function initMatterPeerSet(environment: Environment) {
	const peers = environment.get(PeerSet)

	peers.added.on(async (peer) => {
		logger.log("Matter Peer Discovered!", peer)
	})

	peers.deleted.on(async (peer) => {
		logger.log("Matter Peer Deleted!", peer)
	})
}
