import { SchemaType, declareSchema } from "castmate-schema"
import { TwitchCategory } from "./category"

export const StreamInfoSchema = declareSchema({
	type: Object,
	properties: {
		title: { type: String, name: "Title", maxLength: 140, template: true },
		category: { type: TwitchCategory, name: "Category" },
		tags: {
			type: Array,
			items: declareSchema({ type: String, required: true, template: true }),
			name: "Tags",
			required: true,
			template: true,
		},
	},
})

export type StreamInfo = SchemaType<typeof StreamInfoSchema>
