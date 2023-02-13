<template>
    <div class="wheel-container" 
        :style="{
            '--numSlices': slices,
            '--radius': `${radius}px`,
            '--sliceHeight': `${sliceHeight}px`
        }"
    >
        <div class="wheel">
            <div 
                v-for="slice,i in sliceData"
                class="slice"
                :style="{
                    transform: `rotate(${-i*(360/slices) + wheelAngle}deg)`,
                    '--sliceColor': slice.color,
                    clipPath: `path('${clipPath}')`
                }" 
            >
                <div class="label" :style="slice.fontStyle">{{ slice.text }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import { Color, OverlayFontStyle } from "../typeProxies"

export default {
    widget: {
        name: "Wheel",
        description: "Random Selection Wheel",
        icon: "mdi-tire",
        defaultSize: {
            width: 600,
            height: 600
        },
        aspectRatio: 1
    },
    props: {
        size: { type: Object },
        slices: { type: Number, default: 12, name: "Slice Count" },
        items: { 
            name: "Items",
            type: Array,
            items: {
                type: Object,
                properties: {
                    text: { type: String, name: "Text" },
                    colorOverride: { type: Color, name: "Color Override" },
                    fontOverride: { type: OverlayFontStyle, name: "Font Override", exampleText: "Item Name" },
                }
            }
        },
        colors: {
            name: "Base Styling",
            type: Array,
            items: {
                type: Object,
                properties: {
                    color: { type: Color, name: "Color"},
                    font: { type: OverlayFontStyle, name: "Item Font", exampleText: "Item Name" },
                }
            },
            default: () => [ 
                { 
                    color: "#BA7D00",
                    font: { 
                        fontSize: 45,
                        fontColor: "#FFF1CA",
                        fontFamily: "Arial Rounded MT",
                        fontWeight: 300,
                        stroke: {
                            width: 2,
                            color: "#251600"
                        }
                    }
                }, 
                {
                    color: "#A70010",
                    font: { 
                        fontSize: 45,
                        fontColor: "#FFC5C5",
                        fontFamily: "Arial Rounded MT",
                        fontWeight: 300,
                        stroke: {
                            width: 2,
                            color: "#270000"
                        }
                    }
                } 
            ]
        },
        damping: {
            name: "Damping",
            type: Object,
            properties: {
                base: { type: Number, default: 6, name: "Base" },
                coefficient: { type: Number, default: 0.1, name: "Coefficient" }
            }
        }
    },
    data() {
        return {
            wheelAngle: 0,
            spinVelocity: 0,
            lastTimestamp: null,
        }
    },
    computed: {
        radius() {
            return (this.size?.width ?? 0) / 2;
        },
        theta() {
            return Math.PI*2 / this.slices / 2;
        },
        sliceHeight() {
            const sinTheta = Math.sin(this.theta)
            return 2 * sinTheta * this.radius
        },
        clipPath() {
            const radius = this.radius
            const theta = this.theta
            const cosTheta = Math.cos(theta)
            const sinTheta = Math.sin(theta)

            const width = radius
            const height = 2 * sinTheta * radius

            const arcPath = `M 0,${height/2 - 1} L${cosTheta*width},-1 A ${radius},${radius} ${360/this.slices} 0, 1, ${cosTheta*width}, ${height+1} L 0,${height/2+1} Z`
            return arcPath
        },
        itemIndex() {
            return Math.floor((this.wheelAngle + 180) / (360 / this.slices));
        },
        sliceData() {
            const result = [];

            const colors = this.colors ?? [ {color: "#BA0010"}, {color: "#A70010"} ];

            for (let i = 0; i < this.slices; ++i) {
                const idx = (i + this.itemIndex) % (this.items?.length || 1);
                const colorIndex = (i + this.itemIndex) % colors.length;

                const item = {
                    text: this.items?.[idx]?.text ?? "",
                    color: this.items?.[idx]?.colorOverride ?? colors[colorIndex].color,
                    fontStyle: OverlayFontStyle.getStyleObj(this.items?.[idx]?.fontOverride ?? colors[colorIndex].font)
                }

                result.push(item)
            }

            return result;
         }
    },
    methods: {
        initSlices() {
        },
        requestNewFrame() {
            window.requestAnimationFrame((ts) => this.updateWheel(ts));
        },
        updateWheel(timestamp) {
            if (this.lastTimestamp == null) {
                this.lastTimestamp = timestamp
                this.requestNewFrame();
                return;
            }

            const dt = (timestamp - this.lastTimestamp) / 1000;
            this.lastTimestamp = timestamp;

            const lastAngle = this.wheelAngle

            const lastIndex = Math.floor((lastAngle + 180) / (360 / this.slices));
			const index = Math.floor((this.wheelAngle + 180) / (360 / this.slices));



            this.wheelAngle += this.spinVelocity * dt;

            //Damping
            const dampingBase = this.damping?.base ?? 6;
            const dampingCoefficient = this.damping?.coefficient ?? 0.1;

            this.spinVelocity = Math.max(this.spinVelocity - (this.spinVelocity * dampingCoefficient + dampingBase) * dt, 0)

            if (this.spinVelocity > 0) {
                this.requestNewFrame();
            }
        },
        spinWheel(spinStrength) {
            spinStrength = spinStrength * 50 ?? 50;

            const needsStart = this.spinVelocity == 0;

            this.spinVelocity += spinStrength

            if (needsStart) {
                this.lastTimestamp = null;
                this.requestNewFrame();
            }
        }
    },
    mounted() {
        this.initSlices();
    },
    watch: {
        slices() {
            this.initSlices();
        }
    }
}
</script>

<style scoped>
.wheel-container {
    --circumfrance: calc(6.283185307 * var(--radius));
	--sliceOffset: calc(var(--sliceHeight) / 2);
    width: calc(2 * var(--radius));
	height: calc(2 * var(--radius));
    position: relative;
    overflow: hidden;
    /*border-radius: 100%;*/
}

.wheel {
    height: 100%;
    transform-origin: center center;
    position: relative;
}

.slice {
    transform-origin: left center;
    line-height: var(--sliceHeight);
    position: absolute;
    height: var(--sliceHeight);
    top: calc(50% - var(--sliceOffset));
    left: 50%;
    width: 50%;
    display: block;
    background-color: var(--sliceColor);
}
/*
.slice::before {
    content: "";
    display: block;
    width: 0;
    height: 0;
    border-style: solid;

    margin-bottom: -1px;
    margin-top: -2px;
    border-width: 0 0 calc((var(--sliceHeight) / 2) + 4px) var(--radius);
    border-color: transparent transparent var(--sliceColor) transparent;
}

.slice::after {
    content: "";
    display: block;
    width: 0;
    height: 0;
    border-style: solid;

    margin-top: -1px;
    margin-bottom: -2px;
    border-width: 0 var(--radius) calc((var(--sliceHeight) / 2) + 4px) 0;
    border-color: transparent var(--sliceColor) transparent transparent;
}
*/
.slice .label {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 90%;
    text-align: center;
    padding-left: 20px;
}



</style>