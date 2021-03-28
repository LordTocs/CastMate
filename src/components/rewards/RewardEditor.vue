<template>
  <div>
    <el-form-item label="Description">
      <el-input
        :value="value.description"
        @input="(v) => setSubValue('description', v)"
      />
    </el-form-item>

    <el-form-item label="Cost">
      <el-input-number
        :value="value.cost"
        @input="(v) => setSubValue('cost', v)"
      />
    </el-form-item>

    <el-form-item label="Requires Message">
      <el-switch
        :value="value.inputRequired"
        @input="(v) => setSubValue('inputRequired', v)"
      />
    </el-form-item>

    <el-form-item label="Cooldown">
      <el-input-number
        :value="value.cooldown"
        @input="(v) => setSubValue('cooldown', v)"
      />
    </el-form-item>

    <el-form-item label="Skip Queue">
      <el-switch
        :value="value.skipQueue"
        @input="(v) => setSubValue('skipQueue', v)"
      />
    </el-form-item>

    <el-form-item label="Max Redemptions Per Stream">
      <el-input-number
        :value="value.maxRedemptionsPerStream"
        @input="(v) => setSubValue('maxRedemptionsPerStream', v)"
      />
    </el-form-item>

    <el-form-item label="Max Redemptions Per User Per Stream">
      <el-input-number
        :value="value.maxRedemptionsPerUserPerStream"
        @input="(v) => setSubValue('maxRedemptionsPerUserPerStream', v)"
      />
    </el-form-item>
  </div>
</template>

<script>
export default {
  props: {
    value: {},
  },
  methods: {
    setSubValue(key, value) {
      let newValue = { ...this.value };

      if (value != undefined && value !== "") {
        newValue[key] = value;
      } else {
        delete newValue[key];
      }

      this.$emit("input", newValue);
    },
  },
};
</script>

<style>
</style>