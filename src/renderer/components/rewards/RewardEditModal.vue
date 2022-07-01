<template>
  <v-dialog v-model="dialog" width="50%" @keydown.esc="cancel">
    <v-card>
      <v-toolbar dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ title || "Edit Channel Point Reward" }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <reward-editor v-model="rewardEdit" />
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          text
          class="body-2 font-weight-bold"
          @click.native="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          outlined
          v-if="showSave"
          @click.native="save"
        >
          Save
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          outlined
          v-if="showCreate"
          @click.native="create"
        >
          Create
        </v-btn>
        <v-btn
          color="red"
          class="body-2 font-weight-bold"
          outlined
          v-if="showDelete"
          @click.native="deleteMe"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import RewardEditor from "./RewardEditor.vue";
import _ from "lodash";
import { mapActions } from "vuex";
export default {
  components: { RewardEditor },
  props: {
    reward: {},
    title: {},
    showSave: { type: Boolean, default: () => true },
    showDelete: { type: Boolean, default: () => true },
    showCreate: { type: Boolean, default: () => false },
  },
  data() {
    return {
      rewardEdit: {},
      dialog: false,
    };
  },
  methods: {
    ...mapActions("rewards", ["createReward", "updateReward", "deleteReward"]),
    open() {
      this.rewardEdit = _.cloneDeep(this.reward) || {};
      this.dialog = true;
    },
    save() {
      if (this.reward.name != this.rewardEdit.name) {
        console.log("Detected Rename! ", this.reward.name, this.rewardEdit.name);
        this.$emit("rename", this.rewardEdit.name);
      }
      this.updateReward({
        rewardName: this.reward.name,
        newReward: this.rewardEdit,
      });
      this.trackAnalytic("saveChannelReward");
      this.dialog = false;
    },
    deleteMe() {
      this.deleteReward(this.reward.name);
      this.trackAnalytic("deleteChannelReward");
      this.dialog = false;
    },
    cancel() {
      this.dialog = false;
    },
    create() {
      this.createReward(this.rewardEdit);
      this.dialog = false;
      this.$emit("created", this.rewardEdit.name);
      this.trackAnalytic("createChannelReward");
    },
  },
};
</script>

<style>
</style>