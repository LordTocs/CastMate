<template>
	<flex-scroller ref="scroller" v-model:scroll-y="view.scrollY" v-model:scroll-x="view.scrollX">
		<div class="profile-edit">
			<h1>Triggers</h1>

			<document-data-collection
				class="trigger-area"
				v-model="model.triggers"
				v-model:view="view.triggers"
				:data-component="TriggerEdit"
			>
				<template #no-items>
					<h3>Add a trigger</h3>
				</template>
			</document-data-collection>

			<h1>Activation Conditions</h1>
		</div>
	</flex-scroller>
</template>

<script setup lang="ts">
import { useVModel } from "@vueuse/core"
import { DocumentDataCollection, FlexScroller, TriggerView } from "castmate-ui-core"
import { ProfileData } from "castmate-schema"
import TriggerEdit from "./TriggerEdit.vue"
import { useModel } from "vue"

interface ProfileView {
	scrollX: number
	scrollY: number
	triggers: TriggerView[]
}

const props = withDefaults(
	defineProps<{
		modelValue: ProfileData
		view: ProfileView
	}>(),
	{
		view: () => ({
			scrollX: 0,
			scrollY: 0,
			triggers: [],
		}),
	}
)

const emit = defineEmits(["update:modelValue", "update:view"])

const model = useVModel(props, "modelValue", emit)
const view = useModel(props, "view")
</script>

<style scoped>
.profile-edit {
	padding: 5px;
}

.trigger-area {
	border-radius: var(--border-radius);
	background-color: var(--surface-b);
	padding: 5px;
}
</style>
