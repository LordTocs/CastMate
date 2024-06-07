import { OBSSourceTransform } from "./transform"

export interface OBSConnectionConfig {
	name: string
	host: string
	port: number
	password?: string
	installPath?: string
}

export interface OBSConnectionState {
	connected: boolean
	scene: string
	streaming: boolean
	recording: boolean
	replayBuffering: boolean
	virtualCamming: boolean
}

export interface OBSSceneItem {
	id: number
	index: number
	sourceName: string
	transform: OBSSourceTransform
}

export interface OBSScene {
	name: string //Scenes are identified by their name, it is unique
	sceneItems: OBSSceneItem[]
}
