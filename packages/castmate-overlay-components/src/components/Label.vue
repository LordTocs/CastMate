<template>
    <p> <span :style="fontStyle"> {{ message }} </span> </p>
</template>

<script>
import { OverlayFontStyle } from '../typeProxies.js'
export default {
    props: {
        message: { type: String, default: () => "Text Label", template: true },
        textStyle: { type: OverlayFontStyle, name: "Style", exampleText: "Text" },
    },
    computed: {
        fontStyle() {
            return OverlayFontStyle.getStyleObj(this.textStyle);
        }
    },
    widget: {
        name: "Label",
        description: "Display some text on screen.",
        icon: "mdi-cursor-text",
        defaultSize: {
            width: 300,
            height: 100
        }
    }
}
</script>

<style scoped>
</style>