<template>
  <div class="scroller-outer">
    <div class="scroller-inner">
      <slot />
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.scroller-outer {
  position: relative;
}
.scroller-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>