<template>
    <v-text-field v-model="name" label="Name"/>
    <v-text-field v-model="description" label="Description"/>
</template>

<script>
import { mapModelValues } from '../../utils/modelValue';
export default {
    props: {
        modelValue: {},
    },
    emits: ["update:modelValue"],
    computed: {
        ...mapModelValues(["name", "description"])
    }
}
</script>