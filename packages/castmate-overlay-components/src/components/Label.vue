<template>
<p> {{ message }} </p>
</template>

<script>
export default {
    props: {
        message: { type: String, default: () => "Text Label" }
    },
    widget: {
        name: "Label",
        description: "Display some text on screen.",
        icon: "mdi-edit",
        defaultSize: {
            width: 100,
            height: 50
        }
    }
}
</script>