<template>
	<v-dialog v-model="dialog" max-width="50vw">
		<v-card>
			<v-toolbar dense flat>
				<v-toolbar-title
					class="text-body-2 font-weight-bold grey--text"
				>
					{{ titleText }}
				</v-toolbar-title>
			</v-toolbar>
			<v-card-text>
				<data-input
					v-model="resourceConfig"
					:schema="resourceType.config"
				/>
			</v-card-text>
			<v-card-actions>
				<v-spacer />
				<v-btn color="grey" @click="cancel"> Cancel </v-btn>
				<v-btn color="primary" @click="ok"> {{ okText }} </v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup>
import { ref } from "vue"
import DataInput from "../data/DataInput.vue"
import { useResourceFunctions, useResourceType } from "../../utils/resources"
import { constructDefaultSchema } from "../../utils/objects"
import _cloneDeep from "lodash/cloneDeep"

const props = defineProps({
	resourceTypeId: { type: String },
})

const dialog = ref(false)

const titleText = ref("")
const okText = ref("OK")

const resourceType = useResourceType(props.resourceTypeId)

const resourceConfig = ref({})

let resolver = null

function showEdit(resourceId) {
	const result = new Promise(async (resolve, reject) => {
		const funcs = useResourceFunctions(props.resourceTypeId)

		const resource = await funcs.getById(resourceId)

		if (resource) {
			resourceConfig.value = _cloneDeep(resource.config)
			titleText.value = `Edit ${resourceConfig.value.name}`
			okText.value = "SAVE"
		} else {
			return reject(new Error("Resource Not Found!"))
		}

		dialog.value = true

		resolver = {
			async resolve() {
				try {
					const result = await funcs.setConfig(
						resourceId,
						resourceConfig.value
					)
					resolve(result)
				} catch (err) {
					reject(err)
				} finally {
					dialog.value = false
					resourceConfig.value = {}
				}
			},
			cancel() {
				dialog.value = false
				resourceConfig.value = {}
				resolve(null)
			},
			error(err) {
				resourceConfig.value = false
				dialog.value = false
				reject(err)
			},
		}
	})

	return result
}

function showCreate() {
	const result = new Promise((resolve, reject) => {
		const funcs = useResourceFunctions(props.resourceTypeId)
		resourceConfig.value = constructDefaultSchema(resourceType.value.config)
		titleText.value = `Create New ${resourceType.value.name}`
		okText.value = "CREATE"
		dialog.value = true

		resolver = {
			async resolve() {
				try {
					const result = await funcs.create(resourceConfig.value)
					resolve(result)
				} catch (err) {
					reject(err)
				} finally {
					dialog.value = false
					resourceConfig.value = {}
				}
			},
			cancel() {
				dialog.value = false
				resourceConfig.value = {}
				resolve(null)
			},
			error(err) {
				resourceConfig.value = false
				dialog.value = false
				reject(err)
			},
		}
	})

	return result
}

function ok() {
	if (resolver) {
		resolver.resolve()
		resolver = null
	}
}

function cancel() {
	if (resolver) {
		resolver.cancel()
		resolver = null
	}
}

defineExpose({
	showCreate,
	showEdit,
})
</script>

<style scoped></style>
