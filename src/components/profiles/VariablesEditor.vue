<template>
  <v-card>
    <v-card-title> Variables </v-card-title>
    <v-card-subtitle>
      These are streamer defined values that can change via actions.
    </v-card-subtitle>
    <v-card-text>
      <v-row v-for="(variableName, i) in Object.keys(valueSafe)" :key="i">
        <v-col>
          <key-input
            :value="variableName"
            label="Variable Name"
            @input="(v) => changeKey(variableName, v)"
          />
        </v-col>
        <v-col>
          <number-input
            :value="value[variableName].default"
            label="Starting Value"
            @input="(v) => changeValue(variableName, v)"
            allow-template
          />
        </v-col>
        <div style="margin-top: 28px">
          <v-btn color="red" @click="deleteKey(variableName)"> Delete </v-btn>
        </div>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn @click="addVariable"> New Variable </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import KeyInput from "../data/KeyInput.vue";
import NumberInput from "../data/NumberInput.vue";
export default {
  components: { KeyInput, NumberInput },
  props: {
    value: {},
  },
  computed: {
    valueSafe() {
      if (!this.value) return {};
      return this.value;
    },
  },
  methods: {
    changeKey(oldKey, newKey) {
      const keyMap = { [oldKey]: newKey };
      const keyValues = Object.keys(this.value).map((key) => {
        const newKey = key in keyMap ? keyMap[key] : key;
        return { [newKey]: this.value[key] };
      });

      let result = Object.assign({}, ...keyValues);
      this.$emit("input", result);
    },
    changeValue(key, value) {
      let newValue = { ...this.value };

      newValue[key].default = value;

      this.$emit("input", newValue);
    },
    deleteKey(key) {
      let newValue = { ...this.value };

      delete newValue[key];

      this.$emit("input", newValue);
    },
    addVariable() {
      let newValue = { ...this.value, "": { default: null } };

      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
.input-row {
  display: flex;
  flex-direction: row;
}
.variable-editor {
  text-align: left;
}
</style>