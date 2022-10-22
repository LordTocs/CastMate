<template>
    <div class="editor-base">
        <div class="editor-frame-outer">
            <drag-frame class="editor-frame" ref="dragFrame" :style="frameStyle" :workspaceWidth="overlay.width" :workspaceHeight="overlay.height" @click="frameClicked">
                <overlay-widget v-for="widget,i in (overlay?.widgets || [])" :key="widget.id" 
                    :modelValue="widget"
                    @update:modelValue="updateWidget($event, i)" 
                    :selected="selectedWidget == widget.id"
                    @update:selected="selectedWidget = widget.id"
                />
            </drag-frame>
        </div>
    </div>
</template>

<script>
import { mapIpcs } from '../utils/ipcMap';
import WidgetLoader from '../components/overlays/WidgetLoader.vue'
import DragFrame from '../components/dragging/DragFrame.vue';
import OverlayWidget from '../components/overlays/OverlayWidget.vue';

const testOverlay = {
    width: 1920,
    height: 1080,
    widgets: [
        {
            id: "a",
            type: "Label",
            props: {
                message: "Oh HELLO"
            },
            position: {
                x: 10,
                y: 400,
            },
            size: {
                width: 100,
                height: 30,
            }
        }
    ]
}

export default {
    data() {
        return {
            overlay: testOverlay,
            frameWidth: 10,
            selectedWidget: null,
        }
    },
    components: {
    WidgetLoader,
    DragFrame,
    OverlayWidget
},
    computed: {
        outerStyle() {
            if (!this.overlay)
                return {}
            return {
                paddingBottom: `${this.overlay.height / this.overlay.width * 100}%`
            }
        },
        frameStyle() {
            if (!this.overlay)
                return {}
            return {
                aspectRatio: `${this.overlay.width}/${this.overlay.height}`
            }
        }
    },
    methods: {
        ...mapIpcs("io", ["getOverlays"]),
        updateWidget(newWidgetData, index) {
            //Use Object.assign() so we don't force reactivity at the array level, but instead at the property level.
            Object.assign(this.overlay.widgets[index], newWidgetData)
        },
        frameClicked() {
            this.selectedWidget = null;
        }
    },
    mounted() {
    }
}
</script>

<style scoped>
.editor-base {
    /*
  display: flex;
  flex-direction: row;
  height: 100%;
*/
}

.editor-frame-outer {
    /*position: relative;*/
    /*padding-bottom: 56.25%; /* 16:9 change to be reactive */
    /*width: 100%;*/

    display: grid;
    resize: both;
    overflow: hidden;
}

.editor-frame {
    /*position: absolute;
    top: 0; bottom: 0; left: 0; right: 0;*/
    width: 100%;
    overflow: hidden;

    box-sizing: border-box;

    max-height: 100%;
    margin: auto;

    border-style: solid;
    border-color: white;
    border-width: 1px;

    position: relative;
}

.widget-frame {
    position: absolute;
    border: solid 2px white;
}
</style>