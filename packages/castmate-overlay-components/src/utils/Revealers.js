export default {
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
