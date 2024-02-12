import { CSSProperties } from "vue"

export interface RevealAnimation {
	inactive?: CSSProperties
	enterFrom?: CSSProperties
	enterTo?: CSSProperties
	enterActive?: CSSProperties
	active?: CSSProperties
	leaveFrom?: CSSProperties
	leaveTo?: CSSProperties
	leaveActive?: CSSProperties
}

export const revealers: Record<string, RevealAnimation> = {
	None: {
		inactive: {},
		active: {},
	},
	Fade: {
		inactive: {
			opacity: 0,
		},
		active: {
			opacity: 1,
		},
	},
	Grow: {
		inactive: {
			transform: `scale(0)`,
		},
		active: {
			transform: `scale(1)`,
		},
	},
	"Slide Right": {
		enterFrom: {
			opacity: 0,
			transform: `translateX(-100%)`,
		},
		active: {
			transform: `translateX(0px)`,
		},
		leaveTo: {
			opacity: 0,
			transform: `translateX(100%)`,
		},
	},
}
