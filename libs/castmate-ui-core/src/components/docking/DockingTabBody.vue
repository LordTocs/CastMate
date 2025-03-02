<template>
	<div class="tab" :id="`tabdock-${teleportPerm}`" />
</template>

<script setup lang="ts">
import { type DockedTab } from "../../util/docking"
import DocumentEditor from "../document/DocumentEditor.vue"
import { nextTick, onBeforeMount, onBeforeUpdate, onMounted, onUpdated, ref, useModel } from "vue"
import { nanoid } from "nanoid"

const props = defineProps<{
	modelValue: DockedTab
}>()

const modelObj = useModel(props, "modelValue")

const teleportPerm = ref("")

//Use the mount lifecycle hooks to properly update the teleport id.

onBeforeMount(() => {
	//Generate a new teleport id right before we mount.
	teleportPerm.value = nanoid()
})

onMounted(() => {
	//Tell our teleport to update it's id after we've mounted this div.
	//Vue Teleoports require the teleport destination to be mounted before attempting the teleport.
	modelObj.value.teleportPermutation = teleportPerm.value
})
</script>

<style scoped>
.tab {
	position: relative;
	flex: 1;
}
</style>
