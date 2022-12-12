<template>
    <media-container ref="media" class="alert" v-show="showing" :media-file="media">
        <div class="alert-head">
            <span :style="getFontStyle(headerStyle)">{{ header }}</span>
        </div>
        <div class="alert-body">
            <span :style="getFontStyle(messageStyle)">{{ message }}</span>
        </div>
    </media-container>
</template>

<script>
import { OverlayFontStyle } from '../typeProxies.js'
import MediaContainer from '../utils/MediaContainer.vue'
import { MediaFile } from '../typeProxies.js'

export default {
    components: { MediaContainer },
    inject: ['isEditor'],
    props: {
        headerStyle: { type: OverlayFontStyle, default: () => new OverlayFontStyle(), name: "Header Style", exampleText: "Title" },
        messageStyle: { type: OverlayFontStyle, default: () => new OverlayFontStyle(), name: "Message Style", exampleText: "Message" },
        media: { type: MediaFile, name: "Alert Media", image: true, video: true },
        duration: { type: Number, name: "Duration", default: 2 }
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
        showAlert(header, message, color) {
            this.header = header
            this.message = message
            this.colorRefs.alertColor = color
            this.showing = true

            console.log(this.$refs)
            this.$refs.media.restart()


            setTimeout(() => {
                this.showing = false;
            }, this.duration * 1000);
        },
        setEditorTimer() {
            if (this.isEditor) {
                console.log("Setting Editor Timer")
                if (this.timer) {
                    clearInterval(this.timer)
                    this.timer = null
                }
                this.timer = setInterval(() => this.showAlert("Title", "Message", "#FF0000"), (this.duration + 1) * 1000)
            }
        }
    }, 
    mounted() {
        this.setEditorTimer();
    },
    watch: {
        duration() {
            this.setEditorTimer();
        }
    }
}
</script>

<style scoped>
.alert {
    width: 100%;
    height: 100%;
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