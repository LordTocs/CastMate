<template>
	<div
		class="action-element"
		:style="{ '--action-color': actionDef?.color, '--darker-action-color': darkerActionColor }"
	>
		<div class="action-header"><i class="mdi flex-none" :class="actionDef?.icon" /> {{ actionDef?.name }}</div>
	</div>
</template>

<script setup lang="ts">
import { type ActionInfo } from "castmate-schema"
import { useAction } from "castmate-ui-core"
import { computed } from "vue"
import * as chromatism from "chromatism2"

const props = defineProps<{
	modelValue: ActionInfo
}>()

const emit = defineEmits(["update:modelValue"])

const actionDef = useAction(props.modelValue)

const darkerActionColor = computed(() =>
	actionDef.value?.color ? chromatism.shade(-20, actionDef.value.color).hex : "#3f3f3f"
)
</script>

<style scoped>
.action-header {
	background-color: var(--darker-action-color);
	height: 1.5rem;
}

.action-element {
	border-radius: var(--border-radius);
	background-color: var(--action-color);
	border: solid 2px var(--action-color);
	height: var(--timeline-height);
	width: var(--timeline-height);
}
</style>
