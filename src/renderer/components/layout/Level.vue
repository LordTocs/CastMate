<template>
  <div class="level">
    <slot></slot>
  </div>
</template>

<script>
export default {};
</script>

<style>
.level {
  display: flex;
  flex-direction: row;
  width: 100%;
}

.level .right {
  justify-self: right;
  margin-left: auto;
  display: flex;
  flex-direction: row;
}

.level .left {
  justify-self: left;
  display: flex;
  flex-direction: row;
}

.level .center {
  justify-self: center;
  display: flex;
  flex-direction: row;
}
</style>