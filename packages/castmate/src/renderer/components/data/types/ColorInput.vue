<template>
	<div class="d-flex flex-row">
		<v-menu
			v-model="menuOpen"
			:close-on-content-click="false"
			:contentProps="{ style: { minWidth: 'unset !important' } }"
		>
			<template #activator="{ props }">
				<v-input v-model="modelObj" :density="topProps.density">
					<v-field
						:label="topProps.label"
						:active="!!modelObj"
						:dirty="!!modelObj"
						:clearable="!schema?.required"
						@click:clear="doClear"
					>
						<div
							class="v-field__input"
							v-bind="props"
							style="cursor: pointer"
						>
							<div
								class="swatch"
								:style="{ backgroundColor: modelObj }"
								v-if="!isFixedColor"
							></div>
							<div class="ref-swatch" v-else>
								{{ modelObj.ref }}
							</div>
						</div>
						<template #append-inner v-if="topProps.colorRefs">
							<v-tooltip
								v-for="colorRef in topProps.colorRefs"
								:text="colorRef"
							>
								<template #activator="{ props }">
									<v-btn
										size="x-small"
										v-bind="props"
										@click.stop="
											modelObj = { ref: colorRef }
										"
									>
										{{ getInitials(colorRef) }}
									</v-btn>
								</template>
							</v-tooltip>
						</template>
					</v-field>
				</v-input>
			</template>
			<div @mousedown="cardClick">
				<v-card class="mx-1 my-1">
					<v-color-picker
						v-model="sanitizedColor"
						:show-swatches="topProps.schema?.enum"
						:swatches="swatches"
					/>
					<select-dummy
						ref="dummySelect"
						@copy="copy"
						@cut="cut"
						@paste="paste"
					/>
				</v-card>
			</div>
		</v-menu>
	</div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from "vue"
import { useWindowEventListener } from "../../../utils/events"
import { useModel } from "../../../utils/modelValue"
import SelectDummy from "../../sequences/SelectDummy.vue"

const topProps = defineProps({
	modelValue: {},
	label: { type: String },
	colorRefs: {},
	schema: {},
	density: { type: String },
})
const emit = defineEmits(["update:modelValue"])
const modelObj = useModel(topProps, emit)

const isFixedColor = computed(() => {
	if (!(topProps.modelValue instanceof Object)) {
		return false
	}

	return !!topProps.modelValue.ref
})

const swatches = computed(() => {
	if (!topProps.schema?.enum)
		return []

	const result = []
	const chunkSize = 1;
	const colors = topProps.schema.enum
	for (let i = 0; i < colors.length; i += chunkSize) {
		const chunk = colors.slice(i, i + chunkSize);
		result.push(chunk)
	}
	return result
})

const sanitizedColor = computed({
	get: () => {
		if (isFixedColor.value) return null
		return topProps.modelValue
	},
	set: (value) => {
		modelObj.value = value
	},
})

function getInitials(str) {
	return str[0].toUpperCase()
}

function doClear() {
	console.log("CLEAR!")
	modelObj.value = undefined
}

/**
 *
 * @param {ClipboardEvent} ev
 */
function copy(ev) {
	if (!modelObj.value) return

	if (!isFixedColor.value) {
		ev.clipboardData.setData("text/plain", modelObj.value)
	} else {
		ev.clipboardData.setData(
			"application/json",
			JSON.stringify(modelObj.value)
		)
	}
	ev.preventDefault()
}

/**
 *
 * @param {ClipboardEvent} ev
 */
function paste(ev) {
	const color = ev.clipboardData.getData("text/plain")
	const refColor = ev.clipboardData.getData("application/json")

	if (color && color.length > 0) {
		//Attempting to paste color
		if (!color.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/))
			return

		modelObj.value = color
	} else if (refColor) {
		try {
			const refColorPOJO = JSON.parse(refColor)

			if (!refColorPOJO.ref) {
				return
			}

			if (!topProps.colorRefs?.includes(refColorPOJO.ref)) {
				return
			}

			modelObj.value = { ref: refColorPOJO.ref }
		} catch (err) {}
	}
}

/**
 *
 * @param {ClipboardEvent} ev
 */
function cut(ev) {
	copy(ev)
	modelObj.value = undefined
}

/**
 *
 * @param {PointerEvent} ev
 */
function cardClick(ev) {
	//The inputs inside of the color picker don't stop propagation so ignore them here
	if (ev.target?.nodeName === "INPUT") return

	dummySelect.value?.select()
}

const menuOpen = ref(false)
const dummySelect = ref(null)
watch(menuOpen, () => {
	if (menuOpen.value) {
		nextTick(() => {
			dummySelect.value.select()
		})
	}
})
</script>

<style scoped>
.preview {
	min-height: 43px;
	margin-top: 20px;
	margin-inline-start: var(--v-field-padding-start);
}

.swatch {
	/*width: calc(var(--v-input-control-height) - (var(--v-field-padding-top, 10px) + var(--v-input-padding-top, 0)) - 8px);*/
	width: 100%;
	height: calc(
		var(--v-input-control-height) -
			(var(--v-field-padding-top, 10px) + var(--v-input-padding-top, 0)) -
			8px
	);
	margin: 4px 0;
	border-radius: 3px;
}

.ref-swatch {
	width: 100%;
	height: calc(
		var(--v-input-control-height) -
			(var(--v-field-padding-top, 10px) + var(--v-input-padding-top, 0)) -
			8px
	);
	border-radius: 3px;
	padding-left: 10px;
	padding-right: 10px;
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	background-image: linear-gradient(to right, #d654ff, #0860ff);
}
</style>
