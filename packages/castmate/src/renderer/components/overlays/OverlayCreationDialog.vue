<template>
	<v-dialog v-model="dialog" @keydown.esc="cancel">
		<v-card width="35vw">
			<v-toolbar dense flat>
				<v-toolbar-title
					class="text-body-2 font-weight-bold grey--text"
				>
					{{ props.header }}
				</v-toolbar-title>
			</v-toolbar>
			<v-form @submit.prevent="create">
				<v-card-text>
					<v-text-field
						v-model="name"
						label="Overlay Name"
						ref="nameInput"
					/>
					<div class="d-flex flex-row">
						<number-input
							v-model="width"
							class="mx-1"
							label="Width"
						/>
						<number-input
							v-model="height"
							class="mx-1"
							label="Height"
						/>
					</div>
					<v-card-actions class="pt-3">
						<v-spacer></v-spacer>
						<v-btn
							color="grey"
							text
							class="body-2 font-weight-bold"
							@click.native="cancel"
						>
							Cancel
						</v-btn>
						<v-btn
							color="primary"
							class="body-2 font-weight-bold"
							outlined
							@click.native="create"
						>
							Create
						</v-btn>
					</v-card-actions>
				</v-card-text>
			</v-form>
		</v-card>
	</v-dialog>
</template>

<script setup>
import NumberInput from "../data/types/NumberInput.vue"

import { nextTick, ref } from "vue"

const props = defineProps({
	header: { type: String },
})

const name = ref(null)
const width = ref(1920)
const height = ref(1080)

const nameInput = ref(null)

const dialog = ref(false)

let openPromise = null

function create() {
	if (!openPromise) return

	console.log("Creating", name.value)
	openPromise.resolve({
		name: name.value,
		width: width.value,
		height: height.value,
	})
	openPromise = null
	dialog.value = false
}

function cancel() {
	if (!openPromise) return
	openPromise.resolve(null)
	openPromise = null
	dialog.value = false
}

defineExpose({
	open: () => {
		if (openPromise) return undefined
		dialog.value = true
		nextTick(() => {
			nameInput.value.focus()
		})
		return new Promise((resolve, reject) => {
			openPromise = { resolve, reject }
		})
	},
})
</script>
