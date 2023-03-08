<template>
	<v-dialog
		v-model="dialog"
		:max-width="options.width"
		:style="{ zIndex: options.zIndex }"
		@keydown.esc="cancel"
	>
		<v-card width="35vw">
			<v-toolbar dark :color="options.color" dense flat>
				<v-toolbar-title
					class="text-body-2 font-weight-bold grey--text"
				>
					{{ title }}
				</v-toolbar-title>
			</v-toolbar>
			<v-form @submit.prevent="agree">
				<v-card-text class="pa-4">
					<v-text-field
						v-model="name"
						:label="label"
						ref="nameInput"
					/>
				</v-card-text>
				<v-card-actions class="pt-3">
					<v-spacer></v-spacer>
					<v-btn
						v-if="!options.noconfirm"
						color="grey"
						text
						class="body-2 font-weight-bold"
						@click.native="cancel"
						>{{ rejectText }}</v-btn
					>
					<v-btn
						color="primary"
						class="body-2 font-weight-bold"
						@click.native="agree"
						>{{ confirmText }}</v-btn
					>
				</v-card-actions>
			</v-form>
		</v-card>
	</v-dialog>
</template>

<script>
import { nextTick } from "vue"

// Grabbed from: https://techformist.com/reusable-confirmation-dialog-vuetify/
export default {
	name: "NamedItemConfirmation",
	data() {
		return {
			dialog: false,
			resolve: null,
			reject: null,
			label: null,
			title: null,
			confirmText: null,
			rejectText: null,
			name: null,
			options: {
				color: "grey lighten-3",
				width: 400,
				zIndex: 200,
				noconfirm: false,
			},
		}
	},

	methods: {
		open(title, label, confirmText, rejectText, options) {
			this.dialog = true
			this.title = title
			this.label = label
			this.confirmText = confirmText || "OK"
			this.rejectText = rejectText || "Cancel"
			this.options = Object.assign(this.options, options)
			nextTick(() => {
				this.$refs.nameInput.focus()
			})
			return new Promise((resolve, reject) => {
				this.resolve = resolve
				this.reject = reject
			})
		},
		agree() {
			this.resolve(this.name)
			this.dialog = false
		},
		cancel() {
			this.resolve(false)
			this.dialog = false
		},
	},
}
</script>
