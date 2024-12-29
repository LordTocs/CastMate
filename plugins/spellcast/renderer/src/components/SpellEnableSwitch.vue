<template><p-input-switch v-model="enableModel" /></template>

<script setup lang="ts">
import { SpellConfig, SpellResourceConfig } from "castmate-plugin-spellcast-shared"
import { ResourceData } from "castmate-schema"
import { useResource, useResourceIPCCaller } from "castmate-ui-core"

import PInputSwitch from "primevue/inputswitch"
import { computed } from "vue"

const props = defineProps<{
	spellId: string
}>()

const resource = useResource<ResourceData<SpellResourceConfig>>("SpellHook", () => props.spellId)
const setEnabled = useResourceIPCCaller<(enabled: boolean) => any>("SpellHook", () => props.spellId, "setEnabled")

const enableModel = computed({
	get() {
		return resource.value?.config.spellData.enabled ?? false
	},
	set(v) {
		setEnabled(v)
	},
})
</script>
