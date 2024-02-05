import { FileResource, definePluginResource, ResourceStorage, usePluginLogger } from "castmate-core"
import OBSWebSocket from "obs-websocket-js"
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

	private setupEvents() {
		this.connection.on("ConnectionClosed", () => {
			this.state.connected = false
			if (this.forceStop) {
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
			this.queryInitialState()
		})

		//this.connection.on("")
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
	}

	private async tryConnect(hostname: string, port: number, password?: string) {
		if (this.retryTimeout) {
			clearTimeout(this.retryTimeout)
			this.retryTimeout = null
		}

		try {
			await this.connection.disconnect()
			await this.connection.connect(`ws://${hostname}:${port}`, password)
			this.state.connected = true
			return true
		} catch (err) {
			this.state.connected = false
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
			return []
		}
	}

	async getSceneSource(sceneName: string, itemId: number): Promise<OBSWSSceneItem | undefined> {
		const resp = await this.connection.call("GetSceneItemList", { sceneName })
		const items = resp.sceneItems as unknown as OBSWSSceneItem[]
		return items.find((i) => i.sceneItemId == itemId)
	}

	async popScene() {
		const prevScene = this.sceneHistory.pop()

		if (prevScene) {
			this.poppingScene = true
			this.connection.call("SetCurrentProgramScene", { sceneName: prevScene })
		}
	}
}

export function setupConnections() {
	definePluginResource(OBSConnection)
}
