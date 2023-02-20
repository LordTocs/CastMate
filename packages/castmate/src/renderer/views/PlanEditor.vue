<template>
	<editor-shell @save="save" :name="plan?.name" :dirty="dirty">
		<flex-scroller v-if="plan" style="flex: 1">
			<div class="mx-3 my-3">
				<v-text-field label="Name" v-model="plan.name" />
				<automation-input
					v-model="plan.startAutomation"
					label="Start Automation"
				/>
				<automation-input
					v-model="plan.endAutomation"
					label="End Automation"
				/>

				<v-btn @click="addSegment" color="primary"> Add Segment </v-btn>
				<draggable
					v-model="plan.segments"
					item-key="id"
					handle=".segment-handle"
					:group="{ name: 'segment' }"
				>
					<template #item="{ element, index }">
						<v-card class="my-4">
							<div class="d-flex flex-row">
								<v-sheet
									class="d-flex flex-column justify-center segment-handle"
									style="cursor: grab"
								>
									<v-icon size="x-large" class="mx-2">
										mdi-drag
									</v-icon>
								</v-sheet>
								<div class="flex-grow-1">
									<div class="px-2 py-3">
										<segment-editor
											v-model="plan.segments[index]"
										/>
									</div>
									<v-card-actions>
										<v-spacer />
										<v-btn
											icon="mdi-delete"
											size="small"
											color="error"
											@click="
												plan.segments.splice(index, 1)
											"
										>
										</v-btn>
									</v-card-actions>
								</div>
							</div>
						</v-card>
					</template>
				</draggable>
				<v-btn
					@click="addSegment"
					color="primary"
					v-if="plan.segments?.length"
				>
					Add Segment
				</v-btn>
			</div>
		</flex-scroller>
	</editor-shell>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import Draggable from "vuedraggable"
import AutomationInput from "../components/automations/AutomationInput.vue"
import EditorShell from "../components/editor/EditorShell.vue"
import FlexScroller from "../components/layout/FlexScroller.vue"
import { useResourceFunctions } from "../utils/resources"
import { nanoid } from "nanoid/non-secure"
import SegmentEditor from "../components/segments/SegmentEditor.vue"

const route = useRoute()

const streamplanResource = useResourceFunctions("streamplan")
const planId = computed(() => route.params.planId)
const plan = ref(null)

function addSegment() {
	console.log("Adding New Segment")
	if (!plan.value.segments) {
		plan.value.segments = []
	}

	plan.value.segments.push({ id: nanoid() })
}

onMounted(async () => {
	const p = await streamplanResource.getById(planId.value)

	if (!p) {
		return
	}

	plan.value = p.config
	nextTick(() => (dirty.value = false))
})

const dirty = ref(false)
watch(plan, () => (dirty.value = true), { deep: true })

async function save() {
	await streamplanResource.setConfig(planId.value, plan.value)
	dirty.value = false
}
</script>

<style scoped></style>
