<template>
    <v-select
      v-model="modelObj"
      :items="items"
      item-value="title"
      item-text="title"
      :label="label"
      :density="density"
      :search-input.sync="search"
      :menu-props="{ maxHeight: 300, location: 'bottom' }"
      clearable
    >
      <template #append>
        <div class="d-flex flex-row align-center">
          <v-menu bottom right>
            <template v-slot:activator="{ props }">
              <v-btn size="small" icon="mdi-dots-vertical" v-bind="props" />
            </template>
            <v-list>
              <v-list-item link :disabled="!modelValue">
                <v-list-item-title @click="$refs.editModal.open()">
                  Edit Reward
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="$refs.createModal.open()" link :disabled="!!modelValue">
                <v-list-item-title> Create New Reward </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>
    </v-select>
    

    <reward-edit-modal
      ref="editModal"
      title="Edit Channel Point Reward"
      :reward="currentReward"
      @rename="onRename"
      :showDelete="false"
    />

    <reward-edit-modal
      ref="createModal"
      title="Create Channel Point Reward"
      :showSave="false"
      :showCreate="true"
      :showDelete="false"
      @created="onCreate"
    />
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap";
import { mapModel } from "../../utils/modelValue";
import RewardEditModal from "./RewardEditModal.vue";

export default {
  components: { RewardEditModal },
  props: {
    modelValue: {},
    label: { type: String, default: () => "Channel Point Reward" },
    density: { type: String }
  },
  computed: {
    ...mapModel(),
    currentReward() {
      return this.items.find((r) => r.title == this.modelValue);
    },
  },
  data() {
    return {
      items: [],
      search: null,
    };
  },
  methods: {
    ...mapIpcs("twitch", ["getRewards"]),
    async onCreate(title) {
      this.items = await this.getRewards()  
      this.$emit('update:modelValue', title)
    },
    async onRename(title) {
      this.items = await this.getRewards()  
      this.$emit('update:modelValue', title)
    }
  },
  async mounted() {
    this.items = await this.getRewards()
  },
};
</script>

<style>
</style>