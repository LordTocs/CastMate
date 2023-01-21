<template>
    <timed-reveal ref="alertReveal" :animation="alertAnimation" :transition="alertTransition" >
        <media-container ref="media" class="alert" :media-file="media">
            <div class="alert-head" :style="getPaddingStyle(titleFormat?.padding)">
                <timed-reveal ref="titleReveal" :animation="titleAnimation" :transition="titleFormat?.transition?.duration" :appear-delay="titleFormat?.timing?.appearDelay" :vanish-advance="titleFormat?.timing?.vanishAdvance">
                    <p :style="getFontStyle(titleFormat?.style)">{{ header }}</p>
                </timed-reveal>
            </div>
            <div class="alert-body" :style="getPaddingStyle(messageFormat?.padding)">
                <timed-reveal ref="messageReveal" :animation="messageAnimation" :transition="messageFormat?.transition?.duration" :appear-delay="messageFormat?.timing?.appearDelay" :vanish-advance="messageFormat?.timing?.vanishAdvance">
                    <p :style="getFontStyle(messageFormat?.style)">{{ message }}</p>
                </timed-reveal>
            </div>
        </media-container>
    </timed-reveal>
</template>

<script>
import { OverlayFontStyle, OverlayPadding, OverlayTransition, OverlayTransitionTiming } from '../typeProxies.js'
import MediaContainer from '../utils/MediaContainer.vue'
import { MediaFile } from '../typeProxies.js'
import TimedReveal from '../utils/TimedReveal.vue'
import Revealers from '../utils/Revealers.js'
import _merge from 'lodash/merge'

export default {
    components: { MediaContainer, TimedReveal },
    inject: ['isEditor'],
    props: {
        media: { type: MediaFile, name: "Alert Media", image: true, video: true },
        duration: { type: Number, name: "Duration", default: 2 },
        transition: { type: OverlayTransition, name: "Transition" },
        titleFormat: {
            type: Object,
            name: "Title",
            properties: {
                style: { type: OverlayFontStyle, name: "Style", exampleText: "Title" },
                padding: { type: OverlayPadding, name: "Padding" },
                transition: { type: OverlayTransition, name: "Transition"},
                timing: { type: OverlayTransitionTiming, name: "Timing" },
            }
        },
        messageFormat: {
            type: Object,
            name: "Message",
            properties: {
                style: { type: OverlayFontStyle, name: "Style", exampleText: "Message" },
                padding: { type: OverlayPadding, name: "Padding" },
                transition: { type: OverlayTransition, name: "Transition"},
                timing: { type: OverlayTransitionTiming, name: "Timing" },
            }
        },
    },
    data() {
        return {
            message: null,
            header: null,
            colorRefs: {
                alertColor: "#FF0000"
            }
        }
    },
    widget: {
        name: "Alert Box",
        description: "An ALERT!",
        icon: "mdi-alert-box",
        testActions: ['alerts.alert'],
        colorRefs: ['alertColor'],
        defaultSize: {
            width: 300,
            height: 200
        }
    },
    computed: {
        alertAnimation() {
            return Revealers[this.transition?.animation || 'None']
        },
        alertTransition() {
            return this.transition?.duration || 0.5
        },
        titleAnimation() {
            return Revealers[this.titleFormat?.transition?.animation || 'None']
        },
        messageAnimation() {
            return Revealers[this.messageFormat?.transition?.animation || 'None']
        }
    },
    methods: {
        getFontStyle(headerStyle) {
            return OverlayFontStyle.getStyleObj(headerStyle, this.colorRefs)
        },
        getPaddingStyle(padding) {
            return OverlayPadding.getStyleObject(padding)
        },
        showAlert(header, message, color) {
            this.header = header
            this.message = message
            this.colorRefs.alertColor = color

            this.$refs.alertReveal.appear(this.duration);
            this.$refs.titleReveal.appear(this.duration);
            this.$refs.messageReveal.appear(this.duration);
            this.$refs.media.restart()
        },
        setEditorTimer() {
            if (this.isEditor) {
                if (this.timer) {
                    clearInterval(this.timer)
                    this.timer = null
                }
                //Show right away
                this.showAlert("Title", "Message", "#FF0000")
                //Show in the future
                this.timer = setInterval(() => this.showAlert("Title", "Message", "#FF0000"), (this.duration + 1) * 1000)
            }
        }
    }, 
    mounted() {
        this.setEditorTimer();
    },
    unmounted() {
        if (this.timer)
        {
            clearInterval(this.timer)
        }
    },
    watch: {
        duration() {
            this.setEditorTimer();
        }
    }
}
</script>

<style scoped>

p {
    margin: 0;
}

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
</style>