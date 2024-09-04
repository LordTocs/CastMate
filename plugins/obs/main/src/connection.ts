import {
	FileResource,
	definePluginResource,
	ResourceStorage,
	usePluginLogger,
	ResourceRegistry,
	onLoad,
	getLocalIP,
	sleep,
	AnalyticsService,
	InfoService,
} from "castmate-core"
import OBSWebSocket, { OBSWebSocketError } from "obs-websocket-js"
import {
	OBSConnectionConfig,
	OBSConnectionState,
	OBSSceneListItem,
	OBSWSInput,
	OBSWSSceneItem,
} from "castmate-plugin-obs-shared"
import { nanoid } from "nanoid/non-secure"
import _flatten from "lodash/flatten"
import { SceneSource } from "./obs-data"

import ChildProcess from "node:child_process"

import { app } from "electron"
import regedit from "regedit"
import { nextTick } from "node:process"

class SceneHistory {
	private history: string[] = []

	reset(scene: string) {
		this.history = [scene]
	}

	push(scene: string) {
		this.history.push(scene)

		if (this.history.length > 30) {
			this.history.splice(0, this.history.length - 30)
		}
	}

	pop(): string | undefined {
		this.history.pop()
		return this.history[this.history.length - 1]
	}
}

const logger = usePluginLogger("obs")

function getOBSInstallFromRegistry() {
	return new Promise<string | undefined>((resolve, reject) => {
		regedit.list(["HKLM\\SOFTWARE\\OBS Studio"], (err, result) => {
			if (err) return reject(err)

			try {
				const obsPath = result["HKLM\\SOFTWARE\\OBS Studio"].values[""].value
				if (Array.isArray(obsPath)) {
					return resolve(String(obsPath[0]))
				} else {
					resolve(String(obsPath))
				}
			} catch (err) {
				logger.error("RegRead Error", err)
				resolve(undefined)
			}
		})
	})
}

function openObs(installDir: string) {
	return new Promise((resolve, reject) => {
		const startCmd = `Start-Process "${installDir}\\bin\\64bit\\obs64.exe" -Verb runAs`
		logger.log(`Opening OBS ${startCmd}`)

		if (!installDir) return resolve(false)

		try {
			ChildProcess.exec(
				startCmd,
				{
					shell: "powershell.exe",
					cwd: `${installDir}\\bin\\64bit\\`,
				},
				(err, stdout, stderr) => {
					console.log(stdout)
					console.error(stderr)
					if (err) {
						console.error(err)
						return resolve(false)
					}
					resolve(true)
				}
			)
		} catch (err) {
			console.error("Error Spawning:", err)
			return reject(err)
		}
	})
}

export class OBSConnection extends FileResource<OBSConnectionConfig, OBSConnectionState> {
	static resourceDirectory = "./obs/connections"
	static storage = new ResourceStorage<OBSConnection>("OBSConnection")

	connection: OBSWebSocket = new OBSWebSocket()
	private retryTimeout: NodeJS.Timeout | null = null
	private forceStop: boolean = false
	private poppingScene: boolean = false
	private sceneHistory = new SceneHistory()

	constructor(config?: OBSConnectionConfig) {
		super()

		if (config) {
			this._id = nanoid()
			this._config = {
				...config,
			}
		} else {
			//@ts-ignore
			this._config = {}
		}

		this.state = {
			connected: false,
			scene: "",
			streaming: false,
			recording: false,
			virtualCamming: false,
			replayBuffering: false,
		}

		this.setupEvents()
	}

	async load(savedConfig: OBSConnectionConfig) {
		if (!(await super.load(savedConfig))) return false
		this.tryConnect(this.config.host, this.config.port, this.config.password)
		return true
	}

	async save() {
		const result = await super.save()
		this.tryConnect(this.config.host, this.config.port, this.config.password)
		return result
	}

	private setupEvents() {
		this.connection.on("ConnectionClosed", (err) => {
			if (this.state.connected) {
				logger.log("Connection Closed", err.code, err.name, err.message)
			}

			this.state.connected = false

			if (this.forceStop) {
				logger.log("Force Stopping OBS Connection Loop")
				this.forceStop = false
				return
			}

			this.retryTimeout = setTimeout(() => {
				this.retryTimeout = null
				this.tryConnect(this.config.host, this.config.port, this.config.password)
			}, 15000)
		})

		this.connection.on("ConnectionOpened", () => {})

		this.connection.on("CurrentProgramSceneChanged", ({ sceneName }) => {
			this.state.scene = sceneName
			logger.log("Scene Changed", sceneName)

			//Keep track of a scene history using a stack, but don't push a scene to history if we're currently popping
			if (!this.poppingScene) {
				this.sceneHistory.push(sceneName)
			}

			this.poppingScene = false
		})

		this.connection.on("StreamStateChanged", ({ outputActive }) => {
			this.state.streaming = outputActive

			if (outputActive) {
				AnalyticsService.getInstance().track("goLive", { version: InfoService.getInstance().version })
			} else {
				AnalyticsService.getInstance().track("streamEnded")
			}
		})

		this.connection.on("RecordStateChanged", ({ outputActive }) => {
			this.state.recording = outputActive
		})

		this.connection.on("ReplayBufferStateChanged", ({ outputActive }) => {
			this.state.replayBuffering = outputActive
		})

		this.connection.on("VirtualcamStateChanged", ({ outputActive }) => {
			this.state.virtualCamming = outputActive
		})

		this.connection.on("Identified", (ev) => {
			logger.log("OBS Identified Ver:", ev.negotiatedRpcVersion)

			this.queryInitialStateLoop()
		})
	}

	private async queryInitialStateLoop() {
		for (let i = 0; i < 40; ++i) {
			try {
				await this.queryInitialState()
				return
			} catch (err) {
				if (err.code == 207) {
					logger.log(err.message)
				} else {
					logger.error("Error Trying Initial State Check", err)
				}
			}
			await sleep(1000)
			logger.log("Retrying...")
		}
	}

	private async queryInitialState() {
		const streamStatus = await this.connection.call("GetStreamStatus")
		const recordStatus = await this.connection.call("GetRecordStatus")
		try {
			const replayStatus = await this.connection.call("GetReplayBufferStatus")
			this.state.replayBuffering = replayStatus.outputActive
		} catch {}

		const virtualCamStatus = await this.connection.call("GetVirtualCamStatus")

		this.state.streaming = streamStatus.outputActive
		this.state.recording = recordStatus.outputActive

		this.state.virtualCamming = virtualCamStatus.outputActive

		const sceneResp = await this.connection.call("GetCurrentProgramScene")
		this.state.scene = sceneResp.currentProgramSceneName
		this.sceneHistory.reset(sceneResp.currentProgramSceneName)

		this.state.connected = true
		logger.log("Initial OBS State Queried, Connected Successfully")
	}

	private nextTickConnect(hostname: string, port: number, password?: string) {
		return new Promise<boolean>((resolve, reject) => {
			nextTick(() => {
				//logger.log("Trying Connection", `ws://${hostname}:${port}`, password)
				this.connection
					.connect(`ws://${hostname}:${port}`, password)
					.then((result) => {
						logger.log(
							"Connected to OBS",
							`ws://${hostname}:${port}`,
							"ver",
							result.rpcVersion,
							"negotiatedVer",
							result.negotiatedRpcVersion,
							"socketVer",
							result.obsWebSocketVersion
						)
						resolve(true)
					})
					.catch((err) => {
						reject(err)
					})
			})
		})
	}

	private async tryConnect(hostname: string, port: number, password?: string) {
		if (this.retryTimeout) {
			clearTimeout(this.retryTimeout)
			this.retryTimeout = null
		}

		try {
			this.forceStop = true
			await this.connection.disconnect()
			this.forceStop = false
		} catch (err) {
			logger.error("Unable to Disconnect??", err)
		}

		try {
			//We have to wait for the next tick for the disconnect to completely propagate.
			await this.nextTickConnect(hostname, port, password)

			return true
		} catch (err) {
			return false
		}
	}

	async getSceneNames(): Promise<string[]> {
		try {
			logger.log("Fetching Scene Names")
			const resp = await this.connection.call("GetSceneList")
			const scenes = resp.scenes as unknown as OBSSceneListItem[]
			return scenes.map((s) => s.sceneName).reverse()
		} catch (err) {
			return []
		}
	}

	async getSceneAndGroupNames(): Promise<string[]> {
		try {
			logger.log("Fetching Scene/Group Names")
			const [sceneResp, groupResp] = await Promise.all([
				this.connection.call("GetSceneList"),
				this.connection.call("GetGroupList"),
			])
			const scenes = sceneResp.scenes as unknown as OBSSceneListItem[]
			const groups = groupResp.groups as unknown as string[]
			return [...scenes.map((s) => s.sceneName).reverse(), ...groups]
		} catch (err) {
			return []
		}
	}

	async getInputs(inputKinds?: string | string[]): Promise<string[]> {
		try {
			if (Array.isArray(inputKinds)) {
				const resps = await this.connection.callBatch(
					inputKinds.map((k) => ({ requestType: "GetInputList", requestData: { inputKind: k } }))
				)
				const inputsDeep = resps.map((r) => {
					if (!r.responseData || !("inputs" in r.responseData)) return []
					const inputs = r.responseData.inputs as unknown as OBSWSInput[]
					return inputs.map((i) => i.inputName)
				})
				return _flatten(inputsDeep).sort()
			} else {
				const resp = await this.connection.call("GetInputList", { inputKind: inputKinds })
				const inputs = resp.inputs as unknown as OBSWSInput[]
				return inputs.map((i) => i.inputName)
			}
		} catch (err) {
			return []
		}
	}

	async getSceneSources(sceneName: string | undefined, inputKinds?: string | string[]): Promise<SceneSource[]> {
		if (!sceneName) return []
		try {
			const resp = await this.connection.call("GetSceneItemList", { sceneName })
			let items = resp.sceneItems as unknown as OBSWSSceneItem[]
			if (Array.isArray(inputKinds)) {
				items = items.filter((i) => inputKinds.includes(i.inputKind))
			} else if (inputKinds) {
				items = items.filter((i) => i.inputKind == inputKinds)
			}
			return items.map((i) => ({
				name: i.sourceName,
				value: i.sceneItemId,
			}))
		} catch (err) {
			try {
				const resp = await this.connection.call("GetGroupSceneItemList", { sceneName })
				let items = resp.sceneItems as unknown as OBSWSSceneItem[]
				if (Array.isArray(inputKinds)) {
					items = items.filter((i) => inputKinds.includes(i.inputKind))
				} else if (inputKinds) {
					items = items.filter((i) => i.inputKind == inputKinds)
				}
				return items.map((i) => ({
					name: i.sourceName,
					value: i.sceneItemId,
				}))
			} catch (err) {
				return []
			}
		}
	}

	async getSceneSource(sceneName: string, itemId: number): Promise<OBSWSSceneItem | undefined> {
		const resp = await this.connection.call("GetSceneItemList", { sceneName })
		const items = resp.sceneItems as unknown as OBSWSSceneItem[]
		return items.find((i) => i.sceneItemId == itemId)
	}

	async createNewSource(sourceKind: string, sourceName: string, sceneName: string, settings: any) {
		if (!this.state.connected) return undefined

		const { sceneItemId } = await this.connection.call("CreateInput", {
			sceneName,
			inputName: sourceName,
			inputKind: sourceKind,
			inputSettings: settings,
		})

		return sceneItemId
	}

	async updateSourceSettings(sourceName: string, settings: any) {
		if (!this.state.connected) return

		await this.connection.call("SetInputSettings", {
			inputName: sourceName,
			inputSettings: settings,
		})
	}

	async popScene() {
		const prevScene = this.sceneHistory.pop()

		if (prevScene) {
			this.poppingScene = true
			this.connection.call("SetCurrentProgramScene", { sceneName: prevScene })
		}
	}

	async getPreview() {
		const screenshot = await this.connection.call("GetSourceScreenshot", {
			sourceName: this.state.scene,
			imageFormat: "png",
		})
		return screenshot.imageData
	}

	static async initialize(): Promise<void> {
		await super.initialize()

		ResourceRegistry.getInstance().exposeIPCFunction<OBSConnection>(OBSConnection, "getPreview")
		ResourceRegistry.getInstance().exposeIPCFunction<OBSConnection>(OBSConnection, "openProcess")
		ResourceRegistry.getInstance().exposeIPCFunction<OBSConnection>(OBSConnection, "refreshAllBrowsers")
		ResourceRegistry.getInstance().exposeIPCFunction<OBSConnection>(OBSConnection, "findBrowserByUrlPattern")
		ResourceRegistry.getInstance().exposeIPCFunction<OBSConnection>(OBSConnection, "getRemoteHost")
		ResourceRegistry.getInstance().exposeIPCFunction<OBSConnection>(OBSConnection, "createNewSource")
		ResourceRegistry.getInstance().exposeIPCFunction<OBSConnection>(OBSConnection, "updateSourceSettings")
	}

	/**
	 * Is true if this OBS is on the same computer
	 */
	get isLocal() {
		return this.config.host == "127.0.0.1" || this.config.host?.toLowerCase() == "localhost"
	}

	async openProcess() {
		if (!this.isLocal) return false

		const path = this.config.installPath ?? (await getOBSInstallFromRegistry())

		logger.log("Opening", path)

		if (!path) return false

		try {
			await openObs(path)
			return true
		} catch {
			return false
		}
	}

	async findBrowserByUrlPattern(urlPattern: string) {
		if (!this.state.connected) return undefined

		console.log("Attempting Browser Find")

		const { inputs } = await this.connection.call("GetInputList", {
			inputKind: "browser_source",
		})

		const inputSettingsAndName = await Promise.all(
			inputs.map(async (i) => {
				const result = await this.connection.call("GetInputSettings", {
					inputName: i.inputName as string,
				})
				return { inputName: i.inputName, ...result }
			})
		)

		const urlRegex = new RegExp(urlPattern)

		console.log("Checking Pattern", urlPattern)

		const input = inputSettingsAndName.find((i) => {
			return (i.inputSettings.url as string | undefined)?.match?.(urlRegex)
		})

		return input
	}

	async refreshAllBrowsers() {
		if (!this.state.connected) return

		const { inputs } = await this.connection.call("GetInputList", {
			inputKind: "browser_source",
		})

		await Promise.allSettled(
			inputs.map(async (i) => {
				logger.log("Refreshing", i.inputName)
				await this.connection.call("PressInputPropertiesButton", {
					inputName: i.inputName as string,
					propertyName: "refreshnocache",
				})
			})
		)
	}

	async refreshBrowsersByUrlPattern(urlPattern: string) {
		if (!this.state.connected) return undefined

		const { inputs } = await this.connection.call("GetInputList", {
			inputKind: "browser_source",
		})

		const inputSettingsAndName = await Promise.all(
			inputs.map(async (i) => {
				const result = await this.connection.call("GetInputSettings", {
					inputName: i.inputName as string,
				})
				return { inputName: i.inputName, ...result }
			})
		)

		const urlRegex = new RegExp(urlPattern)

		const matchingInputs = inputSettingsAndName.filter((i) => {
			return (i.inputSettings.url as string | undefined)?.match?.(urlRegex)
		})

		await Promise.allSettled(
			matchingInputs.map(async (i) => {
				logger.log("Refreshing", i.inputName)
				await this.connection.call("PressInputPropertiesButton", {
					inputName: i.inputName as string,
					propertyName: "refreshnocache",
				})
			})
		)
	}

	/**
	 * Returns the localhost if castmate is on the same computer as OBS, otherwise returns the IP of OBS
	 */
	getRemoteHost() {
		if (this.isLocal) return "localhost"
		return getLocalIP()
	}
}

export function setupConnections() {
	onLoad(() => {
		if (app.isPackaged) {
			const loc = regedit.setExternalVBSLocation("resources/regedit/vbs")
			logger.log("Setting External VBS Location", loc)
		} else {
			const loc = regedit.setExternalVBSLocation("../../node_modules/regedit/vbs")
			logger.log("Setting External VBS Location", loc)
		}
	})

	definePluginResource(OBSConnection)
}
