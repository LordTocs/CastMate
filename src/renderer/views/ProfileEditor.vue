<template>
  <div class="d-flex flex-column" style="height: 100%">
    <v-sheet class="py-4 px-4 d-flex">
      <div class="d-flex flex-column mx-4">
        <v-btn
          color="primary"
          fab
          dark
          class="my-1 align-self-center"
          @click="save"
          :disabled="!dirty"
        >
          <v-icon>mdi-content-save</v-icon>
        </v-btn>
      </div>
      <div class="flex-grow-1">
        <h1>{{ profileName }}</h1>
      </div>
    </v-sheet>

    <flex-scroller class="flex-grow-1">
      <v-container fluid>
        <v-row>
          <v-col>
            <!--trigger-list v-if="profile" v-model="profile.triggers" /-->
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card v-if="profile">
              <v-card-title> Profile Activation </v-card-title>
              <v-card-subtitle>
                These conditions dictate whether this profile is active.
              </v-card-subtitle>
              <v-card-text>
                <boolean-group
                  v-model="profile.conditions"
                  :hasHandle="false"
                />
              </v-card-text>
              <v-card-subtitle>
                These automations get run when a profile becomes active and
                becomes inactive.
              </v-card-subtitle>
              <v-card-text>
                <automation-input
                  v-model="profile.onActivate"
                  label="Activation Automation"
                />
                <automation-input
                  v-model="profile.onDeactivate"
                  label="Deactivation Automation"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
          Saved
        </v-snackbar>
      </v-container>
    </flex-scroller>

    <confirm-dialog ref="deleteConfirm" />
    <confirm-dialog ref="saveDlg" />
  </div>
</template>

<script>
import ConditionsEditor from "../components/profiles/ConditionsEditor.vue";
import RewardsEditor from "../components/profiles/RewardsEditor.vue";
import AutomationInput from "../components/automations/AutomationInput.vue";
import { mapGetters } from "vuex";
import BooleanGroup from "../components/conditionals/BooleanGroup.vue";
import FlexScroller from "../components/layout/FlexScroller.vue";
import TriggerList from "../components/triggers/TriggerList.vue";
import { mapIpcs } from "../utils/ipcMap";

export default {
  components: {
    ConditionsEditor,
    RewardsEditor,
    AutomationInput,
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
    BooleanGroup,
    FlexScroller,
    TriggerList,
  },
  computed: {
    ...mapGetters("ipc", ["pluginList"]),
    profileName() {
      return this.$route.params.profile;
    },
    triggerPlugins() {
      return this.pluginList.filter((p) => Object.keys(p.triggers).length > 0);
    },
  },
  data() {
    return {
      profile: null,
      saveSnack: false,
      dirty: false,
    };
  },
  methods: {
    ...mapIpcs("io", ["getProfile", "saveProfile"]),
    async save() {
      await this.saveProfile(this.profileName, this.profile);

      this.saveSnack = true;
      this.dirty = false;
    },
  },
  async mounted() {
    this.profile = await this.getProfile(this.profileName);
    console.log(this.profile);
  },
  watch: {
    profile: {
      deep: true,
      handler(newVal, oldVal) {
        if (oldVal != null) {
          this.dirty = true;
        }
      },
    },
  },
  async beforeRouteLeave(to, from, next) {
    if (!this.dirty) {
      return next();
    }
    if (
      await this.$refs.saveDlg.open(
        "Unsaved Changes",
        "Do you want to save your changes?",
        "Save Changes",
        "Discard Changes"
      )
    ) {
      await this.save();
    }
    return next();
  },
};
</script>

<style>
</style>