import { watch, isRef, onMounted, onBeforeUnmount, unref } from 'vue'

export function useEventListener(
    target,
    event,
    handler
  ) {
    // if its a reactive ref, use a watcher
    if (isRef(target)) {
      watch(target, (value, oldValue) => {
        oldValue?.removeEventListener(event, handler);
        value?.addEventListener(event, handler);
      });
    } else {
      // otherwise use the mounted hook
      onMounted(() => {
        target.addEventListener(event, handler);
      });
    }
    // clean it up
    onBeforeUnmount(() => {
      unref(target)?.removeEventListener(event, handler);
    });
  }