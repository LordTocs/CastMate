<template>
	<data-input v-model="model" :schema="setting.schema" />
</template>

<script setup lang="ts">
import { SettingValue, usePluginStore, DataInput } from "castmate-ui-core"
import { useModel } from "vue"

const pluginStore = usePluginStore

const props = defineProps<{
	modelValue: any
	setting: SettingValue
}>()

const model = useModel(props, "modelValue")
</script>
