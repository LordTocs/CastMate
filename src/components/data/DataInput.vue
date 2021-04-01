<template>
  <tr>
    <td>
      <label class="object-label"> {{ schema.name || label }} </label>
    </td>
    <td style="width: 100%">
      <el-input-number
        :value="value"
        @input="(v) => $emit('input', v)"
        v-if="schema.type == 'Number'"
      />
      <el-input
        :value="value"
        @input="(v) => $emit('input', v)"
        v-else-if="
          schema.type == 'String' ||
          schema.type == 'TemplateString' ||
          schema.type == 'TemplateNumber'
        "
      />
      <el-switch
        :value="value"
        @input="(v) => $emit('input', v)"
        v-else-if="schema.type == 'Boolean'"
      />
      <el-select
        :value="value"
        @input="(v) => $emit('input', v)"
        v-else-if="schema.type == 'OptionalBoolean'"
      >
        <el-option label="On" :value="true" />
        <el-option label="Off" :value="false" />
        <el-option label="Unset" :value="undefined" />
      </el-select>
      <object-editor
        :schema="schema.properties"
        :value="value"
        @input="(v) => $emit('input', v)"
        v-else-if="schema.type == 'Object' && schema.properties"
      />
    </td>
  </tr>
</template>

<script>
export default {
  name: "data-input",
  components: {
    ObjectEditor: () => import("./ObjectEditor.vue"),
    //FreeObjectEditor: () => import("./FreeObjectEditor.vue"),
  },
  props: {
    schema: {},
    value: {},
    label: {},
  },
};
</script>

<style>
.object-label {
  font-size: 14px;
  color: #606266;
  line-height: 32px;
  display: inline-block;
  text-align: right;
  padding-right: 0.5rem;
}

.input-row {
  display: flex;
  flex-direction: row;
}

.input-row:not(:last-child) {
  margin-bottom: 0.35rem;
}
</style>