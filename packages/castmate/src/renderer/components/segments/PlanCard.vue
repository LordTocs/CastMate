<template>
    <v-card>
        <v-card-title class="d-flex flex-row align-center"> 
            Stream Planner
            <template v-if="plans.length > 0">
                <v-select 
                    v-model="selectedPlanId"
                    :items="plans" 
                    class="ml-4"
                    item-title="config.name" 
                    item-value="id" 
                    label="Selected Plan" 
                    :disabled="!!currentPlan"
                    hide-details 
                />
                <v-btn icon="mdi-play" color="green" class="ml-4" @click="start" v-if="!selectedPlan || currentPlan?.id != selectedPlan?.id" :disabled="!selectedPlan"/>
                <v-btn icon="mdi-stop" color="red" class="ml-4" @click="stop" v-else-if="currentPlan?.id == selectedPlan?.id"/>
            </template>
        </v-card-title>
        <v-card-text v-if="plans.length > 0">
            <div class="horizontal-scroller">
                <div class="d-flex flex-row" v-if="selectedPlan">
                    <segment-card v-for="segment in selectedPlan.config.segments" 
                        :segment="segment"
                        :plan-id="selectedPlan.id"
                    />
                </div>
            </div>
        </v-card-text>
        <v-card-text class="d-flex flex-column justify-center align-center" v-else>
            <p class="text-h6 mb-3">Stream Plans are an easy way to manage titles, tags, and automations throughout a stream.</p>
            <v-btn link to="/streamplans" color="primary"> Create a Stream Plan</v-btn>
        </v-card-text>
        <v-card-actions>
            <v-btn icon="mdi-skip-forward" @click="nextSegment" :disabled="!canMoveNextSegment"/>
        </v-card-actions>
    </v-card>
</template>


<script setup>
import { computed, onMounted, ref } from 'vue'
import { useStreamPlanStore } from '../../store/streamplan'
import { useIpc } from '../../utils/ipcMap'
import { useResourceArray } from '../../utils/resources'
import SegmentCard from './SegmentCard.vue'

const plans = useResourceArray("streamplan")
const planStore = useStreamPlanStore();

const selectedPlanId = ref(null)

const selectedPlan = computed(() => plans.value.find(p => p.id == selectedPlanId.value))

const currentPlan = computed(() => plans.value.find(p => p.id == planStore.planId))
const currentSegment = computed(() => currentPlan.value?.segments?.find(s => s.id == planStore.segmentId))

onMounted(() => {
    selectedPlanId.value = currentPlan.value?.id
})

const startPlan = useIpc("streamplan", "startPlan")
const endPlan = useIpc("streamplan", "endPlan")
const nextSegment = useIpc("streamplan", "nextSegment");

const canMoveNextSegment = computed(() => !!currentPlan.value)

async function start () {
    if (selectedPlan.value)
        await startPlan(selectedPlan.value.id)
}

async function stop() {
    await endPlan()
}

</script>

<style scoped>
.horizontal-scroller {
    width: 100%;
    overflow-x: auto;
}
</style>