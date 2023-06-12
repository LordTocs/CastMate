import { defineResource } from "../resources/resource"

class Profile extends defineResource({
	config: {
		type: Object,
		properties: {
			name: { type: String },
		},
	},
	state: {
		type: Object,
		properties: {},
	},
}) {}
