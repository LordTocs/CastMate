<template>
    <transition name="fade">
        <div class="alert" :style="{ borderColor: color || 'transparent' }" v-if="showing || isEditor">
            <div class="alert-head">
                <span :style="getFontStyle(headerStyle)">{{ header }}</span>
            </div>
            <div class="alert-body">
                <span :style="getFontStyle(messageStyle)">{{ message }}</span>
            </div>
        </div>
    </transition>
</template>

<script>
import { OverlayFontStyle } from '../typeProxies.js'

export default {
    props: {
        isEditor: { type: Boolean, default: false },
        headerStyle: { type: OverlayFontStyle, default: () => new OverlayFontStyle(), name: "Header Style", exampleText: "Title" },
        messageStyle: { type: OverlayFontStyle, default: () => new OverlayFontStyle(), name: "Message Style", exampleText: "Message" }
    },
    data() {
        return {
            message:  this.isEditor ? "Message" : null,
            header: this.isEditor ? "Title" : null,
            color: null,
            showing: false,
            colorRefs: {
                alertColor: "#FF0000"
            }
        }
    },
    widget: {
        name: "Alert Box",
        description: "An ALERT!",
        icon: "mdi-square",
        testActions: ['alerts.alert'],
        colorRefs: ['alertColor'],
    },
    methods: {
        getFontStyle(headerStyle) {
            return OverlayFontStyle.getStyleObj(headerStyle, this.colorRefs)
        },
        showAlert(header, message, color, duration) {
            this.header = header
            this.message = message
            this.color = color
            this.colorRefs.alertColor = color
            this.showing = true

            setTimeout(() => {
                this.showing = false;
            }, duration * 1000);
        }
    }
}
</script>

<style scoped>
.alert {
    width: 100%;
    height: 100%;
    border: solid 1px black;
    background-color: grey;
    color: white;
}

.alert-head {
    font-size: 40px;
    text-align: center;
}

.alert-body {
    font-size: 30px;
    text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>