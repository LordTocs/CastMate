import { Color, SchemaBase, registerType } from "castmate-schema"

export type TwitchViewerName = `@${string}` | `${string}`

export const TwitchViewerResolvedSymbol = Symbol()

export interface TwitchViewerDataUnresolved {
	id: string
	displayName: string
	[TwitchViewerResolvedSymbol]: false
}

export interface TwitchViewerDataResolved {
	id: string
	displayName: string
	description: string
	profilePicture: string
	color: Color
	following: boolean
	subbed: boolean
	sub?: {
		tier: 1 | 2 | 3
		gift: boolean
	}
	[TwitchViewerResolvedSymbol]: true
}

export interface TwitchViewerData {
	id: string
	displayName: string
	description: string
	profilePicture: string
	color: Color
	following: boolean
	subbed: boolean
	sub?: {
		tier: 1 | 2 | 3
		gift: boolean
	}
}

export interface TwitchViewer extends TwitchViewerData {
	[Symbol.toPrimitive](): any
}

export const TwitchViewer = {
	factoryCreate() {
		return undefined as unknown as TwitchViewer
	},
	fromData(data: TwitchViewerData): TwitchViewer {
		return {
			...data,
			[Symbol.toPrimitive]() {
				return this.displayName
			},
		}
	},
}
type TwitchViewerFactory = typeof TwitchViewer

interface SchemaTwitchViewer extends SchemaBase<TwitchViewer> {
	type: TwitchViewerFactory
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		TwitchViewer: [SchemaTwitchViewer, TwitchViewer]
	}
}

registerType("TwitchViewer", {
	constructor: TwitchViewer,
})

export const testViewer = TwitchViewer.fromData({
	id: "27082158",
	displayName: "LordTocs",
	description: "LordTocs made CastMate!",
	profilePicture: "",
	color: "#4411FF",
	following: true,
	subbed: true,
	sub: {
		tier: 1,
		gift: false,
	},
})
