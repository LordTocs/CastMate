import { Color } from "../data/color"
import { IPCSchema } from "../schema"

//export type ActionType = "instant" | "time" | "time-indefinite" | "flow"

export interface IPCDurationSliderState {
	min?: number
	max?: number
	sliderProp: string
}

export interface IPCBaseDurationState {
	indefinite?: boolean
}

export interface IPCCropDurationState {
	dragType: "crop"
	duration: number
	leftSlider?: IPCDurationSliderState
	rightSlider?: IPCDurationSliderState
}

export interface IPCFixedDurationState {
	dragType: "fixed"
	duration: number
}

export interface IPCLengthDurationState {
	dragType: "length"
	rightSlider: IPCDurationSliderState
}

export interface IPCInstantDurationState {
	dragType: "instant"
}

export type IPCDurationState =
	| IPCLengthDurationState
	| IPCFixedDurationState
	| IPCCropDurationState
	| IPCInstantDurationState

export type IPCDurationConfig =
	| IPCDurationState
	| {
			propDependencies: string[]
			ipcCallback: string
	  }

export interface IPCActionDefinition {
	readonly id: string
	readonly name: string
	readonly description?: string
	readonly icon?: string
	readonly color?: Color
	readonly duration: IPCDurationConfig
	readonly config: IPCSchema
	readonly result?: IPCSchema
}
