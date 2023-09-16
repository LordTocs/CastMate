<template>
	<div>
		{{ model.property }}
	</div>
</template>

<script setup lang="ts">
import { TwitchViewerGroupProperty } from "castmate-plugin-twitch-shared"
import { useModel } from "vue"

const props = defineProps<{
	modelValue: TwitchViewerGroupProperty
}>()
const model = useModel(props, "modelValue")
</script>
