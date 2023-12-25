import { Color } from "castmate-schema"

export type TwitchViewerName = `@${string}` | `${string}`

export interface TwitchViewer {
	id: string
	name: string
	description: string
	profilePicture: string
	color: Color
	following: boolean
	subbed: boolean
	sub?: {
		tier: 1 | 2 | 3
		gift: boolean
	}
	[Symbol.toPrimitive](): any
}
