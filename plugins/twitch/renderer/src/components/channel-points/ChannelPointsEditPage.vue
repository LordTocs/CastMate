<template>
	<div class="container">
		<div class="inner-container" ref="containerDiv">
			<p-data-table
				class="flex flex-column"
				:value="channelPoints"
				data-key="id"
				:global-filter-fields="['config.name']"
				style="width: 100%; max-height: 100%"
				scrollable
				row-group-mode="subheader"
				group-rows-by="config.controllable"
				sort-field="config.controllable"
				:sort-order="-1"
			>
				<template #header>
					<div class="flex justify-content-end">
						<!--<span class="p-input-icon-left">
							<i class="pi pi-search" />
							<p-input-text v-model="filters['global'].value" placeholder="Search" />
						</span>-->
						<p-button @click="createDialog()"> Create CastMate Reward</p-button>
					</div>
				</template>
				<!--<template #empty> ... </template> -->
				<template #groupheader="{ data }">
					<!--template v-if="(data as ChannelPointResource).config.controllable">
							<div class="flex flex-row">
								<div class="flex-1">
									<h3 class="my-0">CastMate Channel Point Rewards</h3>
								</div>
							</div>
						</template-->
					<template v-if="!(data as ChannelPointResource).config.controllable">
						<div>
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
						</div>
					</template>
				</template>
				<!-- Required because groupby assumes there's a column that it's grouping by -->
				<p-column field="config.controllable"> </p-column>
				<p-column class="column-fit-width">
					<template #body="{ data }: { data: ChannelPointResource }">
						<channel-point-preview :reward="data" />
					</template>
				</p-column>
				<p-column class="column-fit-width">
					<template #body="{ data }: { data: ChannelPointResource }">
						<i
							class="mdi mdi-debug-step-over mr-2"
							v-if="data.config.rewardData.skipQueue"
							v-tooltip="'Redemptions don\'t show in the creator dashboard queue.'"
						/>
						<i
							class="mdi mdi-comment-text-outline mr-2"
							v-if="data.config.rewardData.userInputRequired"
							v-tooltip="'Viewers required to type a message with the redemption.'"
						/>
					</template>
				</p-column>
				<p-column header="Cost" field="config.rewardData.cost" class="column-fit-width">
					<template #body="{ data }: { data: ChannelPointResource }">
						<i class="twi twi-channel-points" />{{ data.config.rewardData.cost }}
					</template>
				</p-column>
				<p-column header="Title" field="config.name"> </p-column>
				<p-column header="Prompt" field="config.rewardData.prompt"> </p-column>
				<p-column header="Cooldown" class="column-fit-width">
					<template #body="{ data }: { data: ChannelPointResource }">
						<span v-if="data.config.rewardData.cooldown != null">
							<i class="mdi mdi-timer-outline" />
							<duration-label
								:model-value="(data.config.rewardData.cooldown as Duration)"
							></duration-label>
						</span>
						<i class="mdi mdi-timer-cancel-outline" v-else> </i>
					</template>
				</p-column>
				<p-column>
					<template #body="{ data }: { data: ChannelPointResource }" class="column-fit-width">
						<span v-if="data.config.rewardData.maxRedemptionsPerStream" class="mr-2">
							{{ data.config.rewardData.maxRedemptionsPerStream }}
						</span>
						<span v-else class="mr-2">∞</span>
						<i class="mdi mdi-account-group" v-tooltip.left="'Max Redemptions Per Stream'" />
					</template>
				</p-column>
				<p-column>
					<template #body="{ data }: { data: ChannelPointResource }" class="column-fit-width">
						<span v-if="data.config.rewardData.maxRedemptionsPerUserPerStream" class="mr-2">
							{{ data.config.rewardData.maxRedemptionsPerUserPerStream }}
						</span>
						<span v-else class="mr-2">∞</span>
						<i class="mdi mdi-account" v-tooltip.left="'Max Redemptions Per User Per Stream'" />
					</template>
				</p-column>
				<p-column class="column-fit-width">
					<template #body="{ data }: { data: ChannelPointResource }">
						<div class="flex flex-row" v-if="data.config.controllable">
							<p-button icon="mdi mdi-pencil" text @click="editDialog(data.id)"></p-button>
							<p-button
								icon="mdi mdi-delete"
								severity="error"
								text
								@click="deleteDialog(data.id)"
							></p-button>
						</div>
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
import { useResourceArray, useResourceData } from "castmate-ui-core"
import { ResourceData } from "castmate-schema"
import ChannelPointPreview from "./ChannelPointPreview.vue"
import { ChannelPointRewardConfig, ChannelPointRewardState } from "castmate-plugin-twitch-shared"
import { DurationLabel } from "castmate-ui-core"
import { Duration } from "castmate-schema"
import { useResourceEditDialog, useResourceCreateDialog, useResourceDeleteDialog } from "castmate-ui-core"

const filterValue = ref("")

const filters = ref({
	global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const containerDiv = ref<HTMLElement | null>(null)
const containerSize = useElementSize(containerDiv)

type ChannelPointResource = ResourceData<ChannelPointRewardConfig, ChannelPointRewardState>
const channelPoints = useResourceArray<ChannelPointResource>("ChannelPointReward")

const editDialog = useResourceEditDialog("ChannelPointReward")
const createDialog = useResourceCreateDialog("ChannelPointReward")
const deleteDialog = useResourceDeleteDialog("ChannelPointReward")
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
