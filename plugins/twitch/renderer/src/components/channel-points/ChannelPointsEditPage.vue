<template>
	<div class="container">
		<div class="inner-container" ref="containerDiv">
			<p-data-table
				v-model:filters="filters"
				:value="channelPoints"
				data-key="id"
				:global-filter-fields="['config.name']"
				style="width: 100%"
				scrollable
				:scroll-height="`${containerSize.height.value}px`"
				row-group-mode="subheader"
				group-rows-by="config.controllable"
			>
				<template #header>
					<div class="flex justify-content-end">
						<span class="p-input-icon-left">
							<i class="pi pi-search" />
							<p-input-text v-model="filters['global'].value" placeholder="Search" />
						</span>
					</div>
				</template>
				<template #groupheader="{ data }">
					<div>
						<template v-if="(data as ChannelPointResource).config.controllable">
							<h3 class="my-0">CastMate Channel Point Rewards</h3>
						</template>
						<template v-else>
							<div class="flex flex-row">
								<div class="flex-1">
									<h3 class="my-0">Other Channel Point Rewards</h3>
									<h4 class="my-0">
										These rewards aren't can't be enabled and disabled with CastMate profiles. But
										you can still use them in triggers.
									</h4>
								</div>
								<a
									class="p-button p-component"
									href="https://dashboard.twitch.tv/viewer-rewards/channel-points/rewards"
									target="_blank"
								>
									Open Dashboard
								</a>
							</div>
						</template>
					</div>
				</template>
				<p-column>
					<template #body="{ data }">
						<channel-point-preview :reward="data" />
					</template>
				</p-column>
			</p-data-table>
		</div>
	</div>
</template>

<script setup lang="ts">
import PDataTable from "primevue/datatable"
import PColumn from "primevue/column"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import { FilterMatchMode } from "primevue/api"
import { computed, ref } from "vue"
import { useElementSize } from "@vueuse/core"
import { useResources } from "castmate-ui-core"
import { ResourceData } from "castmate-schema"
import ChannelPointPreview from "./ChannelPointPreview.vue"
import { ChannelPointRewardConfig, ChannelPointRewardState } from "castmate-plugin-twitch-shared"

const filters = ref({
	global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const containerDiv = ref<HTMLElement | null>(null)
const containerSize = useElementSize(containerDiv)

type ChannelPointResource = ResourceData<ChannelPointRewardConfig, ChannelPointRewardState>
const channelPointResources = useResources<ChannelPointResource>("ChannelPointReward")
const channelPoints = computed(() => [...channelPointResources.value.resources.values()])
</script>

<style scoped>
.container {
	position: relative;
}

.inner-container {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	overflow: hidden;
}
</style>
