<template>
	<duration-field v-model="model" :placeholder="placeholder" :disabled="disabled" :required="required" />
</template>

<script setup lang="ts">
import { Duration } from "castmate-schema"
import DurationField from "./DurationField.vue"
import { useDataBinding } from "../../../main"

const model = defineModel<Duration | undefined>()

const props = defineProps<{
	placeholder?: string
	disabled?: boolean
	localPath?: string
	required?: boolean
}>()

useDataBinding(() => props.localPath)
</script>
