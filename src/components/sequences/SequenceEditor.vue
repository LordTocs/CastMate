<template>
  <div class="drag-area" ref="dragArea" @mousedown="startDrag">
    <div
      v-if="dragBox.dragging"
      ref="selectRect"
      class="select-rect"
      :style="{
        left: dragLeft + 'px',
        top: dragTop + 'px',
        width: dragWidth + 'px',
        height: dragHeight + 'px',
      }"
    />
    <draggable
      :list="value"
      handle=".handle"
      group="actions"
      style="flex: 1"
      class="sequence-container"
      :component-data="getDraggableData()"
      as="drag-select"
    >
      <sequence-item
        v-for="(action, i) in value"
        :key="i"
        ref="sequenceItems"
        :selected="selected.includes(i)"
        :value="action"
        @input="(v) => updateAction(i, v)"
        @delete="deleteAction(i)"
      />
    </draggable>
  </div>
</template>

<script>
import SequenceItem from "./SequenceItem.vue";
import Draggable from "vuedraggable";
import { ipcRenderer } from "electron";
export default {
  components: { SequenceItem, Draggable },
  props: {
    value: {},
  },
  data() {
    return {
      selected: [],
      dragBox: {
        dragging: false,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
      },
    };
  },
  computed: {
    dragTop() {
      return this.dragBox.endY < this.dragBox.startY
        ? this.dragBox.endY
        : this.dragBox.startY;
    },
    dragLeft() {
      return this.dragBox.endX < this.dragBox.startX
        ? this.dragBox.endX
        : this.dragBox.startX;
    },
    dragWidth() {
      return Math.abs(this.dragBox.endX - this.dragBox.startX);
    },
    dragHeight() {
      return Math.abs(this.dragBox.endY - this.dragBox.startY);
    },
  },
  methods: {
    getDraggableData() {
      return {
        on: {
          inputChanged: this.changed,
          start: this.onDragStart,
        },
        attrs: {
          /*dense: true,
          "align-top": true,*/
        },
      };
    },
    changed(arr) {
      console.log(arr);
      if (arr instanceof Array) {
        this.$emit("input", arr);
      }
    },
    updateAction(index, value) {
      let newValue = [...this.value];

      newValue[index] = value;

      this.$emit("input", newValue);
    },
    deleteAction(index) {
      let newValue = [...this.value];

      newValue.splice(index, 1);

      this.$emit("input", newValue);
    },
    newActionGroup() {
      let newValue = [...this.value, {}];

      this.$emit("input", newValue);
    },
    testSequence() {
      ipcRenderer.invoke("pushToQueue", this.value);
    },
    rectOverlap(r1, r2) {
      return (
        r1.left < r2.right &&
        r1.right > r2.left &&
        r1.top < r2.bottom &&
        r1.bottom > r2.top
      );
    },
    onDragStart() {
      this.abandonDrag();
    },
    doDrag() {
      const areaRect = this.$refs.dragArea.getBoundingClientRect();
      const dragRect = {
        top: areaRect.top + this.dragTop,
        left: areaRect.left + this.dragLeft,
        bottom: areaRect.top + this.dragTop + this.dragHeight,
        right: areaRect.left + this.dragLeft + this.dragWidth,
      };

      const newSelection = [];

      for (let itemId in this.$refs.sequenceItems) {
        const item = this.$refs.sequenceItems[itemId];
        const itemRect = item.getBoundingClientRect
          ? item.getBoundingClientRect()
          : item.$el.getBoundingClientRect();

        if (this.rectOverlap(dragRect, itemRect)) {
          newSelection.push(Number(itemId));
        }
      }

      this.selected = newSelection;
    },
    startDrag(e) {
      let containerRect = this.$refs.dragArea.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      this.dragBox.startX = x;
      this.dragBox.startY = y;
      this.dragBox.endX = x;
      this.dragBox.endY = y;
      this.dragBox.dragging = true;

      this.doDrag();

      document.addEventListener("mousemove", this.drag);
    },
    drag(e) {
      let containerRect = this.$refs.dragArea.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      this.dragBox.endX = x;
      this.dragBox.endY = y;

      this.doDrag();
    },
    stopDrag(e) {
      let containerRect = this.$refs.dragArea.getBoundingClientRect();
      const x = e.clientX - containerRect.left;
      const y = e.clientY - containerRect.top;

      this.doDrag();

      this.abandonDrag();
    },
    abandonDrag() {
      this.dragBox.dragging = false;
      this.dragBox.startX = 0;
      this.dragBox.startY = 0;
      this.dragBox.endX = 0;
      this.dragBox.endY = 0;
      this.dragBox.dragging = false;

      document.removeEventListener("mousemove", this.drag);
    },
  },
  mounted() {
    document.addEventListener("mouseup", this.stopDrag);
    //document.addEventListener("touchend", this.stopDrag);
  },
  destroyed() {
    document.removeEventListener("mouseup", this.stopDrag);
    //document.removeEventListener("touchend", this.stopDrag);
  },
};
</script>

<style scoped>
.sequence-container {
  padding: 16px;
}

.drag-area {
  display: flex;
  flex-direction: column;
  position: relative;
}

.select-rect {
  position: absolute;
  border-width: 1px;
  border-color: red;
  border-style: solid;
}
</style>