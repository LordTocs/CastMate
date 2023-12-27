import { Color, SchemaBase, registerType } from "castmate-schema"

export type TwitchViewerName = `@${string}` | `${string}`

export const TwitchViewerResolvedSymbol = Symbol()

export interface TwitchViewerDisplayData {
	id: string
	displayName: string
	profilePicture: string
	color: Color
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
	[Symbol.toPrimitive](hint: "default" | "string" | "number"): any
}

export type TwitchViewerUnresolved = string

export const TwitchViewer = {
	factoryCreate() {
		return undefined as unknown as TwitchViewerUnresolved
	},
	fromData(data: TwitchViewerData): TwitchViewer {
		return {
			...data,
			[Symbol.toPrimitive](hint: "default" | "string" | "number") {
				return this.displayName
			},
		}
	},
}
type TwitchViewerFactory = typeof TwitchViewer

export interface SchemaTwitchViewer extends SchemaBase<TwitchViewerUnresolved> {
	type: TwitchViewerFactory
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		TwitchViewer: [SchemaTwitchViewer, TwitchViewerUnresolved]
	}

	interface ExposedSchemaTypeMap {
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
