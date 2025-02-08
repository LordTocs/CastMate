<template>
	<div>
		<div class="flex flex-row align-items-center justify-content-center mb-2" v-if="allowMargin || allowPadding">
			<margin-padding-edit v-model="model" :allow-margin="allowMargin" :allow-padding="allowPadding" />
		</div>
		<div
			class="flex flex-row align-items-center justify-content-center mb-2"
			v-if="schema.allowHorizontalAlign == null || schema.allowHorizontalAlign"
		>
			<c-select-button
				v-model="model.horizontalAlign"
				:options="['left', 'center', 'right']"
				local-path="horizontalAlign"
			>
				<template #option="slotProps">
					<i :class="horizontalIcons[slotProps.option]"></i>
				</template>
			</c-select-button>
		</div>
		<div
			class="flex flex-row align-items-center justify-content-center"
			v-if="schema.allowVerticalAlign == null || schema.allowVerticalAlign"
		>
			<c-select-button
				v-model="model.verticalAlign"
				:options="['top', 'center', 'bottom']"
				local-path="verticalAlign"
			>
				<template #option="slotProps">
					<i :class="verticalIcons[slotProps.option]"></i>
				</template>
			</c-select-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayBlockStyle, SchemaOverlayBlockStyle } from "castmate-plugin-overlays-shared"
import MarginPaddingEdit from "./MarginPaddingEdit.vue"
import { computed, ref, useModel } from "vue"
import { SharedDataInputProps, useDataBinding, CSelectButton } from "castmate-ui-core"
import PSelectButton from "primevue/selectbutton"

const props = defineProps<
	{
		schema: SchemaOverlayBlockStyle
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const allowMargin = computed(() => props.schema.allowMargin ?? true)
const allowPadding = computed(() => props.schema.allowPadding ?? true)

const model = defineModel<OverlayBlockStyle>({ default: () => OverlayBlockStyle.factoryCreate() })

const horizontalIcons: Record<string, string> = {
	left: "mdi mdi-align-horizontal-left",
	center: "mdi mdi-align-horizontal-center",
	right: "mdi mdi-align-horizontal-right",
}

const verticalIcons: Record<string, string> = {
	top: "mdi mdi-align-vertical-top",
	center: "mdi mdi-align-vertical-center",
	bottom: "mdi mdi-align-vertical-bottom",
}
</script>
