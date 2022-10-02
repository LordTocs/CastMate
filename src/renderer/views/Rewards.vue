<template>
  <v-container fluid>
    <v-btn
      color="primary"
      size="large"
      @click="$refs.createModal.open()"
      class="my-3"
    >
      Add Channel Point Reward
    </v-btn>
    <v-table>
      <thead>
        <tr>
          <th></th>
          <th>
            Cost
          </th>
          <th>
            Reward
          </th>
          <th>
            Cooldown
          </th>
          <th colspan="2">
            Max Redemptions
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody v-if="rewards.length > 0">
        <tr v-for="reward,i in rewards" :key="reward.name">
          <td class="fitwidth">
            <v-tooltip v-if="reward.autoFulfill" location="right">
              <template #activator="{ props }">
                <v-icon v-bind="props" icon="mdi-debug-step-over" class="mx-1"/>
              </template>
              This reward won't show in the creator dashboard queue.
            </v-tooltip>
            <v-tooltip v-if="reward.userInputRequired" location="right">
              <template #activator="{ props }">
                <v-icon v-bind="props" icon="mdi-comment-text-outline" class="mx-1"/>
              </template>
              This reward requires the viewer to send a message.
            </v-tooltip>
          </td>
          <td class="fitwidth">
            {{ reward.cost }}
          </td>
          <td>
            {{ reward.title }}
          </td>
          <td class="fitwidth text-center">
            <span v-if="reward.globalCooldown">{{ reward.globalCooldown }}s</span>
          </td>
          <td class="fitwidth">
            <v-tooltip location="left">
              <template #activator="{ props }">
                <span v-bind="props">
                  {{ reward.maxRedemptionsPerStream || "∞" }} <v-icon icon="mdi-account-group" />
                </span>
              </template>
              Max Redemptions Per Stream
            </v-tooltip>
          </td>
          <td class="fitwidth">
            <v-tooltip location="left">
              <template #activator="{ props }">
                <span v-bind="props">
                  {{ reward.maxRedemptionsPerUserPerStream || "∞" }} <v-icon icon="mdi-account" />
                </span>
              </template>
              Max Redemptions Per User Per Stream
            </v-tooltip>
          </td>
          <td class="fitwidth">
            <reward-edit-modal :reward="reward" ref="editModals" @delete="refresh" @updated="refresh" />
            <v-btn size="small" icon="mdi-pencil" class="mx-1" @click="$refs.editModals[i].open()" />
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <td colspan="7" class="px-4 py-8 text-center">
          <span>
            Create some Channel Point Rewards here so CastMate can use them.
          </span>
        </td>
      </tbody>
    </v-table>
    <reward-edit-modal
      ref="createModal"
      title="Create Channel Point Reward"
      :showSave="false"
      :showCreate="true"
      :showDelete="false"
      @created="refresh"
    />
    <v-btn
      color="primary"
      size="large"
      @click="$refs.createModal.open()"
      class="my-3"
    >
      Add Channel Point Reward
    </v-btn>
  </v-container>
</template>

<script>
import RewardEditModal from "../components/rewards/RewardEditModal.vue";
import { mapIpcs } from "../utils/ipcMap";
export default {
  components: {
    RewardEditModal,
  },
  data() {
    return {
      rewards: []
    }
  },
  methods: {
    ...mapIpcs("twitch", ["getRewards"]),
    async refresh() {
      console.log("Refreshing");
      this.rewards = await this.getRewards();
    }
  },
  async mounted() {
    await this.refresh();
  }
};
</script>

<style scoped>
td.fitwidth{
  width: 1px;
  white-space: nowrap;
}
</style>