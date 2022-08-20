<template>
  <v-container fluid>
    <v-btn
      color="primary"
      fixed
      fab
      large
      right
      bottom
      class="my-2"
      @click="addSegment({ title: '', goLive: '', tags: [], sequence: [] })"
    >
      Create Segment
    </v-btn>
    <v-row v-for="(segment, index) in segments" :key="index">
      <v-col>
        <segment-editor :model-value="segment" @update:modelValue="(v) => updateSegment({ index, segment: v })" @activate="activate(index)" @delete="removeSegment(index)" />
      </v-col>
    </v-row>
    <v-btn
      color="primary"
      fixed
      fab
      large
      right
      bottom
      class="my-2"
      @click="addSegment({ title: '', goLive: '', tags: [], sequence: [] })"
    >
      Create Segment
    </v-btn>
  </v-container>
</template>

<script>
import { mapActions, mapGetters } from "vuex";
import { mapIpcs } from "../utils/ipcMap";
import { trackAnalytic } from "../utils/analytics.js";
import _cloneDeep from "lodash/cloneDeep"
import SegmentEditor from "../components/segments/SegmentEditor.vue";

export default {
  components: {
    SegmentEditor
},
  computed: {
    ...mapGetters("segments", ["segments"]),
  },
  methods: {
    ...mapActions("segments", ["updateSegment", "addSegment", "removeSegment"]),
    ...mapIpcs("twitch", ["updateStreamInfo"]),
    ...mapIpcs("core", ["runAutomation"]),
    async activate(index) {
      if (!this.segments[index]) return;

      const segment = this.segments[index];

      this.updateStreamInfo(segment);

      if (segment.automation) {
        this.runAutomation(segment.automation);
      }

      trackAnalytic("activateSegment");
    },
  },
};
</script>

<style>
</style>