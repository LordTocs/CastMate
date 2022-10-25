<template>
    <div>
        {{ props.message }}
    </div>
</template>

<script setup>
    const props = defineProps({
        message: { type: String, name: "Message" },
    })
</script>

<script>
export default {
    widget: {
        aspectRatio: 1.0
    }
}
</script>