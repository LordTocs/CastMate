<template>
	<v-card
		variant="outlined"
		width="250px"
		class="d-flex flex-column mr-4"
		:class="{ 'selected-segment': active }"
	>
		<v-card-title class="d-flex flex-row justify-center">
			{{ segment.name }}
		</v-card-title>
		<template v-if="segment.streamInfo">
			<v-tooltip location="top" :content-props="tooltipProps">
				<template #activator="{ props }">
					<div
						class="d-flex flex-row align-center justify-center"
						v-bind="props"
					>
						<category-view
							class="my-1 mx-2"
							:category-id="segment.streamInfo.category"
							icon-only
						/>
						<span class="text-subtitle-1">
							{{ segment.streamInfo.title }}
						</span>
					</div>
				</template>
				<span class="text-subtitle-1">
					{{ segment.streamInfo.title }}
				</span>
				<category-view
					class="my-1 mx-2"
					:category-id="segment.streamInfo.category"
					v-if="segment.streamInfo.category"
				/>
				<div class="d-flex flex-row flex-wrap">
					<v-chip
						v-for="tag in segment.streamInfo.tags"
						size="x-small"
					>
						{{ tag }}
					</v-chip>
				</div>
			</v-tooltip>
		</template>
		<automation-preview
			size="x-small"
			class="mt-1 justify-center"
			v-if="segment.startAutomation"
			:automation="segment.startAutomation"
		/>
		<v-spacer />
		<v-card-actions>
			<segment-quick-edit-dialog
				:plan-id="props.planId"
				:segment-id="props.segment.id"
				ref="editDlg"
			/>
			<v-btn size="small" icon="mdi-pencil" @click="editDlg.open()" />
			<v-spacer />
			<v-btn
				size="small"
				icon="mdi-play"
				color="green"
				@click="activate"
				v-if="planActive"
			/>
		</v-card-actions>
	</v-card>
</template>

<script setup>
import { computed, ref } from "vue"
import { useStreamPlanStore } from "../../store/streamplan"
import { useIpc } from "../../utils/ipcMap"
import AutomationPreview from "../automations/AutomationPreview.vue"
import CategoryView from "../data/CategoryView.vue"
import SegmentQuickEditDialog from "./SegmentQuickEditDialog.vue"

const props = defineProps({
	segment: {},
	planId: { type: String },
})

const editDlg = ref(null)

const planStore = useStreamPlanStore()

const planActive = computed(() => planStore.planId == props.planId)
const active = computed(() => planStore.segmentId == props.segment.id)

const startSegment = useIpc("streamplan", "startSegment")
async function activate() {
	await startSegment(props.segment.id)
}

const tooltipProps = {
	style: "background-color: #212121; color: rgba(255,255,255,0.87); border: solid 1px white;", //Is there a way to do this with the material palette?
}
</script>

<style scoped>
.selected-segment {
	border-color: #00ff00;
}
</style>
