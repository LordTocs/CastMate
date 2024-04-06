import { Duration, SchemaBase, registerType } from "castmate-schema"

export interface OverlayTransitionAnimation {
	duration: Duration
	preset?: string
}

const OverlayTransitionSymbol = Symbol()
export const OverlayTransitionAnimation = {
	factoryCreate(): OverlayTransitionAnimation {
		return { duration: 1, preset: "Fade" }
	},
	[OverlayTransitionSymbol]: "OverlayTransitionAnimation",
}

export type OverlayTransitionAnimationFactory = typeof OverlayTransitionAnimation

export interface SchemaOverlayTransitionAnimation extends SchemaBase<OverlayTransitionAnimation> {
	type: OverlayTransitionAnimationFactory
}

registerType("OverlayTransitionAnimation", { constructor: OverlayTransitionAnimation })

declare module "castmate-schema" {
	interface SchemaTypeMap {
		OverlayTransitionAnimation: [SchemaOverlayTransitionAnimation, OverlayTransitionAnimation]
	}
}
