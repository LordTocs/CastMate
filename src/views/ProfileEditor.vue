<template>
  <div class="d-flex flex-column" style="height: 100%">
    <v-sheet color="grey darken-4" class="py-4 px-4 d-flex">
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
            <!--v-card>
              <v-card-title> Triggers </v-card-title>
              <v-card-subtitle>
                Triggers are events you can bind automations to. Chat commands,
                follows, channelpoints, etc...
              </v-card-subtitle>
              <v-card-text v-if="profile">
                <v-row v-for="plugin in triggerPlugins" :key="plugin.name">
                  <v-col>
                    <plugin-triggers
                      :plugin="plugin"
                      :value="profile.triggers[plugin.name] || {}"
                      @input="(v) => $set(profile.triggers, plugin.name, v)"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card-->
            <trigger-list v-if="profile" v-model="profile.triggers" />
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
                <automation-selector
                  v-model="profile.onActivate"
                  label="Activation Automation"
                />
                <automation-selector
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
import PluginTriggers from "../components/profiles/PluginTriggers.vue";
import ConditionsEditor from "../components/profiles/ConditionsEditor.vue";
import RewardsEditor from "../components/profiles/RewardsEditor.vue";
import AutomationSelector from "../components/automations/AutomationSelector.vue";
import { mapActions, mapGetters } from "vuex";
import BooleanExpression from "../components/conditionals/BooleanExpression.vue";
import BooleanGroup from "../components/conditionals/BooleanGroup.vue";
import FlexScroller from "../components/layout/FlexScroller.vue";
import TriggerList from "../components/triggers/TriggerList.vue";
import { loadProfile, saveProfile } from "../utils/fileTools";

export default {
  components: {
    PluginTriggers,
    ConditionsEditor,
    RewardsEditor,
    AutomationSelector,
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
    BooleanExpression,
    BooleanGroup,
    FlexScroller,
    TriggerList,
  },
  computed: {
    ...mapGetters("ipc", ["paths", "pluginList"]),
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
    ...mapActions("profile", ["loadProfile", "saveProfile"]),
    async save() {
      await saveProfile(this.profileName, this.profile);

      this.saveSnack = true;
      this.dirty = false;
    },
  },
  async mounted() {
    this.profile = await loadProfile(this.profileName);
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