<template>
	<p>
		<span class="text--secondary" v-if="label"> {{ label }}: </span>
		{{ hook?.name || hookId }}
	</p>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap"

export default {
	props: {
		label: {},
		hookId: {},
	},
	data() {
		return {
			hook: null,
		}
	},
	methods: {
		...mapIpcs("spellcast", ["getSpellHook"]),
		async query() {
			if (!this.hookId) return

			this.hook = await this.getSpellHook(this.hookId)
		},
	},
	async mounted() {
		await this.query()
	},
	watch: {
		hookId() {
			this.query()
		},
	},
}
</script>
