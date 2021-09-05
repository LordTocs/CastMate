<template>
  <v-container fluid>
    <v-row v-for="(segment, i) in segments" :key="i">
      <v-col>
        <v-card>
          <v-card-title>
            <v-text-field
              :value="segment.title || ''"
              @change="(t) => updateTitle(i, t)"
              label="Title"
              counter
              maxlength="140"
            />
          </v-card-title>
          <v-card-text>
            <!--v-text-field
              :value="segment.goLive || ''"
              @change="(gl) => updateGoLive(i, gl)"
              label="Go Live"
              counter
              maxlength="140"
            /-->
            <category-search
              :value="segment.category"
              @change="(c) => updateCategory(i, c)"
            />
            <tag-select
              :value="segment.tags"
              @change="(t) => updateTags(i, t)"
            />
            On Start
            <sequence-editor
              :value="segment.sequence"
              @input="(a) => updateSequence(i, a)"
            />
          </v-card-text>
          <v-card-actions>
            <add-action-popover @select="(v) => addAction(i, v)" />
          </v-card-actions>
          <v-card-actions>
            <v-btn color="primary" @click="activate(i)">
              <v-icon> mdi-play </v-icon> Activate
            </v-btn>
            <v-spacer />
            <v-btn icon @click="removeSegment(i)">
              <v-icon> mdi-cancel </v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-fab-transition>
      <v-btn
        color="primary"
        fixed
        fab
        large
        right
        bottom
        @click="addSegment({ title: '', goLive: '', tags: [], actions: [] })"
      >
        <v-icon> mdi-plus </v-icon>
      </v-btn>
    </v-fab-transition>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import SequenceEditor from "../components/sequences/SequenceEditor.vue";
import AddActionPopover from "../components/actions/AddActionPopover.vue";
import CategorySearch from "../components/data/CategorySearch.vue";
import TagSelect from "../components/data/TagSelect.vue";
import { mapIpcs } from "../utils/ipcMap";

import { ipcRenderer } from "electron";

export default {
  components: { SequenceEditor, AddActionPopover, CategorySearch, TagSelect },
  computed: {
    ...mapGetters("segments", ["segments"]),
  },
  methods: {
    ...mapActions("segments", ["updateSegment", "addSegment", "removeSegment"]),
    ...mapIpcs("twitch", ["updateStreamInfo"]),
    async activate(index) {
      if (!this.segments[index]) return;

      const segment = this.segments[index];

      this.updateStreamInfo(segment);

      ipcRenderer.invoke("pushToQueue", segment.sequence);
    },
    async updateTitle(index, title) {
      const segment = { ...this.segments[index], title };
      await this.updateSegment({ index, segment });
    },
    async updateGoLive(index, goLive) {
      const segment = { ...this.segments[index], goLive };
      await this.updateSegment({ index, segment });
    },
    async updateSequence(index, sequence) {
      const segment = { ...this.segments[index], sequence };
      await this.updateSegment({ index, segment });
    },
    async updateCategory(index, category) {
      const segment = { ...this.segments[index], category };
      await this.updateSegment({ index, segment });
    },
    async updateTags(index, tags) {
      const segment = { ...this.segments[index], tags };
      await this.updateSegment({ index, segment });
    },
    async addAction(index, action) {
      const segment = { ...this.segments[index] };
      segment.sequence.push({ [action]: null });
      await this.updateSegment({ index, segment });
    },
  },
};
</script>

<style>
</style>