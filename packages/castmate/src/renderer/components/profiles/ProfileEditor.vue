<template>
	<flex-scroller>
		<div class="blah">
			<document-data-collection v-model="model.triggers" :data-component="TriggerEdit" />
			<!-- <trigger-edit class="mb-3" v-for="(t, i) in model.triggers" :key="t.id" v-model="model.triggers[i]" /> -->
		</div>
	</flex-scroller>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { DocumentDataCollection, FlexScroller } from "castmate-ui-core"
import { ProfileData } from "castmate-schema"
import TriggerEdit from "./TriggerEdit.vue"

const props = defineProps<{
	modelValue: ProfileData
}>()

const emit = defineEmits(["update:modelValue"])

const model = useVModel(props, "modelValue", emit)
</script>

<style scoped>
.blah {
	padding: 5px;
}
</style>
