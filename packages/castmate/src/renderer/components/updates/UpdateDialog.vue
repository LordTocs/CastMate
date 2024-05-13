<template>
	<div v-if="updateData" class="flex flex-column">
		<div>
			<h1>{{ updateData.version }} - {{ updateData.name }}</h1>
		</div>
		<flex-scroller class="flex-grow-1" style="height: 50vh">
			<div ref="notes" v-html="updateData.notes"></div>
		</flex-scroller>
		<div class="flex flex-row">
			<p-button @click="doUpdate" :loading="updating">Update!</p-button>
			<div class="flex-grow-1" />
			<p-button outlined @click="cancel">Skip</p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { UpdateData } from "castmate-schema"
import { useIpcCaller, FlexScroller, useDialogRef } from "castmate-ui-core"
import { nextTick, onMounted, ref } from "vue"
import PButton from "primevue/button"

const updateData = ref<UpdateData>()

const getUpdateData = useIpcCaller<() => UpdateData | undefined>("info", "getUpdateInfo")

const updateCastMate = useIpcCaller<() => any>("info", "updateCastMate")

const notes = ref<HTMLElement>()

onMounted(async () => {
	updateData.value = await getUpdateData()
	nextTick(() => {
		//nextTick(() => {
		console.log("Release Notes?", notes)
		const links = notes.value?.querySelectorAll("a") ?? []
		for (const link of links) {
			link.target = "_blank"
		}
		//})
	})
})

const dialogRef = useDialogRef()

function cancel() {
	dialogRef.value?.close()
}

const updating = ref(false)
async function doUpdate() {
	updating.value = true
	await updateCastMate()
}
</script>
