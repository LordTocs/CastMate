<template>
<p> {{ message }} </p>
</template>

<script>
export default {
    props: {
        message: { type: String, default: () => "Text Label", template: true }
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

<style scoped>
p {
    color: #fff;
    text-shadow: 2px 0 0 #000, 0 -2px 0 #000, 0 2px 0 #000, -2px 0 0 #000;
    font-size: 40px;
    font-family: 'Anton', sans-serif;
    text-align: center;
}
</style>