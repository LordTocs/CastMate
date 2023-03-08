<template>
    <p v-if="modelValue">
		<span class="text--secondary" v-if="props.schema.name || props.label">
			{{ props.schema.name || label }}:
		</span>
		<div class="swatch" v-if="!isTemplated" :style="{backgroundColor: previewColor}">
        </div>
        <div class="swatch templated" v-else>
            <v-icon icon="mdi-code-braces" size="small" style="width: 3em"/>
        </div>
	</p>
</template>

<script setup>
import { computed } from 'vue';
import { isHexColor } from '../../../utils/color';

const props = defineProps({
	modelValue: { type: String },
	schema: {},
	label: { type: String },
})

function isColorRef(obj) {
	return !!obj?.ref
}


const isColorString = computed(
	() =>
		isHexColor(props.modelValue) ||
		isColorRef(props.modelValue) ||
		props.modelValue == undefined ||
		props.modelValue == null ||
		props.modelValue.length == 0
)

const isTemplated = computed(() => !isColorString.value)

const previewColor = computed(() => {
	if (!props.modelValue) return "black"

	return props.modelValue
})

</script>

<style scoped>
.swatch {
    height: 1.5em;
    width: 4em;
    line-height: 1.5em;
    border-radius: 3px;
    display: inline-block;
}

.templated {
    background-image: linear-gradient(to right, #d654ff, #0860ff);
}
</style>