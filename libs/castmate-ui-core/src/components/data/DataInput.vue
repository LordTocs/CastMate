<template>
	<template v-if="schema.type == Object"> </template>
</template>

<script setup lang="ts">
import { useDataInputs } from "../../util/data"
import { Schema } from "castmate-schema"
const dataInputs = useDataInputs()

const props = defineProps<{
	schema: Schema
	context: any
	secret: boolean
	density: "default" | "comfortable" | "compact" //From vuetify
}>()
</script>
