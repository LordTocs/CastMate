<template>
	<flex-scroller ref="scroller" v-model:scroll-y="view.scrollY" v-model:scroll-x="view.scrollX">
		<div class="profile-edit">
			<h1>Triggers</h1>

			<document-data-collection
				class="trigger-area"
				v-model="model.triggers"
				v-model:view="view.triggers"
				:data-component="TriggerEdit"
				local-path="triggers"
			>
				<template #header>
					<div v-if="hasTriggers" class="flex flex-column p-1">
						<div>
							<p-button @click="createTriggerBeginning">Add Trigger</p-button>
						</div>
					</div>
				</template>
				<template #no-items>
					<div class="flex flex-column align-items-center p-3">
						<h3>Triggers are how CastMate responds to events.</h3>
						<p-button @click="createTriggerEnd">Add Trigger</p-button>
					</div>
				</template>
				<template #footer>
					<div v-if="hasTriggers" class="flex flex-column p-1">
						<div>
							<p-button @click="createTriggerEnd">Add Trigger</p-button>
						</div>
					</div>
				</template>
			</document-data-collection>

			<h1>Activation Conditions</h1>
			<boolean-expression-input v-model="model.activationCondition" />
		</div>
	</flex-scroller>
</template>

<script setup lang="ts">
import { DocumentDataCollection, FlexScroller, ProfileView, BooleanExpressionInput } from "castmate-ui-core"
import { ProfileConfig } from "castmate-schema"
import TriggerEdit from "./TriggerEdit.vue"
import { computed, useModel } from "vue"
import PButton from "primevue/button"
import { nanoid } from "nanoid/non-secure"

const props = withDefaults(
	defineProps<{
		modelValue: ProfileConfig
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

const hasTriggers = computed(() => props.modelValue.triggers.length > 0)

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

function createTriggerEnd() {
	const id = nanoid()

	model.value.triggers.push({
		id,
		queue: null,
		config: {},
		sequence: { actions: [] },
		floatingSequences: [],
	})

	view.value.triggers.push({
		id,
		open: true,
		height: 600,
		automationView: {
			panState: {
				panX: 0,
				panY: 0,
				zoomX: 1,
				zoomY: 1,
				panning: false,
			},
		},
	})
}

function createTriggerBeginning() {
	const id = nanoid()

	model.value.triggers.splice(0, 0, {
		id,
		queue: null,
		config: {},
		sequence: { actions: [] },
		floatingSequences: [],
	})

	view.value.triggers.splice(0, 0, {
		id,
		open: true,
		height: 600,
		automationView: {
			panState: {
				panX: 0,
				panY: 0,
				zoomX: 1,
				zoomY: 1,
				panning: false,
			},
		},
	})
}
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
