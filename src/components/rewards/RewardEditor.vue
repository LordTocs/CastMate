<template>
  <div>
    <confirm-dialog ref="deleteConfirm" />

    <v-text-field v-model="editValue.name" label="Reward Name" />

    <v-text-field label="Description" v-model="editValue.description" />

    <v-text-field label="Cost" type="number" v-model="editValue.cost" />

    <v-text-field label="Cooldown" type="number" v-model="editValue.cooldown" />

    <v-switch label="Requires Message" v-model="editValue.inputRequired" />

    <v-switch label="Skip Queue" v-model="editValue.skipQueue" />

    <v-text-field
      label="Max Redemptions Per Stream"
      type="number"
      v-model="editValue.maxRedemptionsPerStream"
    />

    <v-text-field
      label="Max Redemptions Per User Per Stream"
      type="number"
      v-model="editValue.maxRedemptionsPerUserPerStream"
    />

    <v-row>
      <v-col>
        <v-btn @click="endEdit"> Save </v-btn>
      </v-col>
      <v-spacer />
      <v-col>
        <v-btn @click="deleteMe" color="red"> Delete </v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import _ from "lodash";

export default {
  props: {
    value: {},
  },
  components: {
    ConfirmDialog: () => import("../dialogs/ConfirmDialog.vue"),
  },
  data() {
    return {
      editValue: {},
    };
  },
  methods: {
    startEdit() {
      this.editValue = _.clone(this.value);
    },
    endEdit() {
      this.$emit("input", this.editValue);
    },
    async deleteMe() {
      console.log("Starting Delete");
      if (
        await this.$refs.deleteConfirm.open(
          "Confirm",
          "Are you sure you want to delete this channel point reward?"
        )
      ) {
        this.$emit("delete");
      }
    },
  },
  watch: {
    value: {
      handler() {
        this.startEdit();
      },
    },
  },
  mounted() {
    this.startEdit();
  },
};
</script>

<style>
</style>