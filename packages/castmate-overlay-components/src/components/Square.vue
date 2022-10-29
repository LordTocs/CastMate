<template>
    <div>
        {{ props.message }}
        {{ props.test?.hello }}
    </div>
</template>

<script setup>
    const props = defineProps({
        message: { type: String, name: "Message" },
        test: { 
            type: Object, 
            properties: {
                hello: { type: String, name: "Hello" },
                goodbye: { type: String, name: "Goodbye" }
            },
            name: "Test"
         }
    })
</script>

<script>
export default {
    widget: {
        aspectRatio: 1.0
    }
}
</script>