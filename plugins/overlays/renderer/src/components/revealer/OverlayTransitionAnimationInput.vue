<template>
	<data-input-base v-model="model" :schema="schema" :toggle-template="false">
		<template #prepend>
			<c-duration-input v-model="durationModel" style="width: 5rem" local-path="duration" />
		</template>

		<template #default="inputProps">
			<c-dropdown
				v-model="presetModel"
				:options="presetOptions"
				class="w-full"
				v-bind="inputProps"
				local-path="preset"
			/>
		</template>
	</data-input-base>
</template>

<script setup lang="ts">
import {
	SharedDataInputProps,
	DataInputBase,
	useDataBinding,
	useOptionalDefaultableModel,
	CDropdown,
	CDurationInput,
} from "castmate-ui-core"
import { OverlayTransitionAnimation, SchemaOverlayTransitionAnimation } from "castmate-plugin-overlays-shared"
import { computed, useModel } from "vue"

import { MenuItem } from "primevue/menuitem"
import { revealers } from "castmate-overlay-core"

const props = defineProps<
	{
		modelValue: OverlayTransitionAnimation | undefined
		schema: SchemaOverlayTransitionAnimation
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

useDataBinding(() => props.localPath)

const makeDefault = () => OverlayTransitionAnimation.factoryCreate()

const durationModel = useOptionalDefaultableModel(model, "duration", makeDefault)
const presetModel = useOptionalDefaultableModel(model, "preset", makeDefault)

const presetOptions = computed(() =>
	Object.keys(revealers).map(
		(key) =>
			({
				label: key,
				code: key,
			} as MenuItem)
	)
)
</script>
