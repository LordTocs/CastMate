<template>
  <v-container fluid>
    <v-row style="padding-bottom: 3.5rem">
      <v-col>
        <v-row v-for="(commandKey, i) in commandList" :key="i">
          <v-col>
            <command-card
              :value="commands[commandKey]"
              :actionKey="commandKey"
              @input="(newData) => updateCommand(commandKey, newData)"
              @delete="deleteCommand(commandKey)"
              @key-change="(v) => updateCommandKey(commandKey, v)"
            />
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-card-actions>
      <v-btn @click="addCommand"> Add Command </v-btn>
    </v-card-actions>
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
import CommandCard from "../components/commands/CommandCard.vue";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { mapGetters } from "vuex";
import { changeObjectKey } from "../utils/objects.js";

export default {
  components: {
    CommandCard,
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
  },
  computed: {
    ...mapGetters("ipc", ["paths"]),
    commandList() {
      if (!this.commands) {
        return [];
      }
      return Object.keys(this.commands).filter((key) => key != "imports");
    },
    commandFileName() {
      return this.$route.params.commandFile;
    },
  },
  data() {
    return {
      commands: {},
      saveSnack: false,
      fab: false,
    };
  },
  methods: {
    updateCommandKey(oldKey, newKey) {
      this.commands = changeObjectKey(this.commands, oldKey, newKey);
    },
    updateCommand(command, data) {
      this.commands[command] = data;
    },
    deleteCommand(command) {
      delete this.commands[command];
    },
    addCommand() {
      this.commands[""] = { actions: [], sync: false };
    },

    async save() {
      let newYaml = YAML.stringify(this.commands);

      await fs.promises.writeFile(
        path.join(this.paths.userFolder, `commands/${this.commandFileName}.yaml`),
        newYaml
      );

      this.saveSnack = true;
    },
    async deleteMe() {
      if (
        await this.$refs.deleteConfirm.open(
          "Confirm",
          "Are you sure you want to delete this command file?"
        )
      ) {
        await fs.promises.unlink(
          path.join(this.paths.userFolder, `commands/${this.commandFileName}.yaml`)
        );

        this.$router.push("/");
      }
    },
  },
  async mounted() {
    let fileData = await fs.promises.readFile(
      path.join(this.paths.userFolder, `commands/${this.commandFileName}.yaml`),
      "utf-8"
    );

    this.commands = YAML.parse(fileData);
  },
};
</script>

<style>
</style>