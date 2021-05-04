<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <trigger-editor v-model="triggers" :triggerKey="triggersName" />
      </v-col>
    </v-row>
    <v-speed-dial v-model="fab" fixed bottom right open-on-hover>
      <template v-slot:activator>
        <v-btn v-model="fab" color="primary" fab>
          <v-icon v-if="fab"> mdi-close </v-icon>
          <v-icon v-else> mdi-dots-vertical </v-icon>
        </v-btn>
      </template>
      <v-btn fab dark small color="green" @click="save">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
      <v-btn fab dark small color="red" @click="deleteMe">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </v-speed-dial>
    <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
      Saved
    </v-snackbar>
    <confirm-dialog ref="deleteConfirm" />
  </v-container>
</template>

<script>
import TriggerEditor from "../components/profiles/TriggerEditor.vue";
import YAML from "yaml";
import fs from "fs";
import path from "path";

export default {
  components: {
    TriggerEditor,
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
  },
  computed: {
    triggersName() {
      return this.$route.params.triggers;
    },
  },
  data() {
    return {
      triggers: {},
      saveSnack: false,
      fab: false,
    };
  },
  methods: {
    async save() {
      let newYaml = YAML.stringify(this.triggers);

      await fs.promises.writeFile(
        path.join("./user/triggers", `${this.triggersName}.yaml`),
        newYaml
      );

      this.saveSnack = true;
    },
    async deleteMe() {
      if (
        await this.$refs.deleteConfirm.open(
          "Confirm",
          "Are you sure you want to delete this trigger file?"
        )
      ) {
        await fs.promises.unlink(`./user/triggers/${this.triggersName}.yaml`);

        this.$router.push("/");
      }
    },
  },
  async mounted() {
    let fileData = await fs.promises.readFile(
      path.join("./user/triggers", `${this.triggersName}.yaml`),
      "utf-8"
    );

    this.triggers = YAML.parse(fileData);
  },
};
</script>

<style>
</style>