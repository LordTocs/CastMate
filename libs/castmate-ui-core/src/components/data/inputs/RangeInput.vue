<template>
	<div>
		<div class="flex flex-row">
			<div class="force-float-label flex-grow-1">
				<div class="flex flex-row flex-grow-1" input-id="range">
					<range-number-input v-model="min" local-path="min" placeholder="-∞" />
					<span class="mx-1 flex align-items-center justify-content-center">⟶</span>
					<range-number-input v-model="max" local-path="max" placeholder="∞" />
				</div>
				<label for="range" class="force-float"> {{ props.schema.name }}</label>
			</div>
			<p-button
				v-if="hasMenu"
				class="ml-1 flex-shrink-0"
				text
				icon="mdi mdi-dots-vertical"
				aria-controls="input_menu"
				@click="menu?.toggle($event)"
			></p-button>
			<p-menu ref="menu" id="input_menu" :model="endMenuItems" :popup="true" v-if="hasMenu" />
		</div>

		<div class="flex flex-row">
			<error-label :error-message="errorMessage" />
		</div>
	</div>
</template>

<script setup lang="ts">
import CContextMenu from "../../util/CContextMenu.vue"
import { SchemaRange, SchemaBase, Range } from "castmate-schema"
import { computed, useModel, ref } from "vue"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import type { MenuItem } from "primevue/menuitem"

import { SharedDataInputProps } from "../DataInputTypes"
import { useValidator } from "../../../util/validation"
import { useDataBinding } from "../../../main"

import RangeNumberInput from "../base-components/range/RangeNumberInput.vue"

const props = defineProps<
	{
		schema: SchemaRange & SchemaBase
		modelValue: Range | undefined
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const canClear = computed(() => !props.schema.required)
function clear() {
	model.value = undefined
}

const endMenuItems = computed<MenuItem[]>(() => {
	let result: MenuItem[] = []

	if (canClear.value) {
		result.push({
			label: "Clear",
			command(event) {
				clear()
			},
		})
	}

	return result
})

const menu = ref<InstanceType<typeof PMenu>>()
const hasMenu = computed(() => {
	return endMenuItems.value.length > 0
})

const canTemplate = computed(() => !!props.schema?.template)

const min = computed({
	get() {
		return model.value?.min
	},
	set(v) {
		if (v != null) {
			if (!model.value) {
				model.value = { min: v }
			} else {
				model.value.min = v
			}
		} else {
			if (model.value) {
				if ("max" in model.value) {
					delete model.value.min
				} else {
					model.value = undefined
				}
			}
		}
	},
})

const max = computed({
	get() {
		return model.value?.max
	},
	set(v) {
		if (v != null) {
			if (!model.value) {
				model.value = { max: v }
			} else {
				model.value.max = v
			}
		} else {
			if (model.value) {
				if ("min" in model.value) {
					delete model.value.max
				} else {
					model.value = undefined
				}
			}
		}
	},
})

const model = useModel(props, "modelValue")

const errorMessage = useValidator(model, () => props.schema)
</script>

<style scoped>
.component-span {
	display: flex;
	align-items: stretch;
	width: 100%;
}

.sub-label {
	color: #b3b3b3;
	font-size: 12px;
	margin-left: 0.75rem;
}

.force-float {
	top: -0.75rem;
	font-size: 12px;
	left: 0.75rem;
	color: #b3b3b3;
	position: absolute;
	pointer-events: none;
	margin-top: -0.5rem;
	transition-property: all;
	transition-timing-function: ease;
	line-height: 1;
}

.force-float-label {
	position: relative;
}
.left-fix :deep(input) {
	border-top-left-radius: 0 !important;
	border-bottom-left-radius: 0 !important;
}
</style>
