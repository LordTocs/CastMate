<template>
	<v-autocomplete
		v-model="modelObj"
		:items="resourceItems"
		item-title="config.name"
		item-value="id"
		:label="props.label"
		clearable
		:density="props.density"
		:menu-props="{ maxHeight: 200, location: 'bottom' }"
	>
		<template #append v-if="resourceType?.inlineEdit">
			<div class="d-flex flex-row align-center">
				<resource-dialog :resource-type-id="props.schema.resourceType" ref="dlg" />
				<v-menu bottom right>
					<template v-slot:activator="{ props: activatorProps }">
						<v-btn
							variant="flat"
							size="small"
							icon="mdi-dots-vertical"
							v-bind="activatorProps"
						/>
					</template>
					<v-list>
						<v-list-item link :disabled="!props.modelValue">
							<v-list-item-title @click="dlg.showEdit(props.modelValue)">
								Edit {{ resourceType.name }}
							</v-list-item-title>
						</v-list-item>
						<v-list-item
							@click="doCreate"
							link
							:disabled="!!props.modelValue"
						>
							<v-list-item-title>
								Create New {{ resourceType.name }}
							</v-list-item-title>
						</v-list-item>
					</v-list>
				</v-menu>
			</div>
		</template>
	</v-autocomplete>
</template>

<script setup>
import { ref } from "vue";
import { useModel } from "../../../utils/modelValue.js"
import { useResourceArray, useResourceType } from "../../../utils/resources.js"
import ResourceDialog from "../../dialogs/ResourceDialog.vue";

const props = defineProps({
	modelValue: {},
	schema: {},
	label: {},
	density: { type: String },
})

const dlg = ref(null)

const emit = defineEmits(["update:modelValue"])

const modelObj = useModel(props, emit)

const resourceType = useResourceType(props.schema.resourceType)
const resourceItems = useResourceArray(props.schema.resourceType)

async function doCreate() {
	const newResource = await dlg.value.showCreate()
	if (newResource) {
		modelObj.value = newResource.id
	}
}
</script>
