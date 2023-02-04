<template>
    <div class="bounce-house" ref="bounceHouse">
        <img 
            class="bouncey-body" 
            v-for="body in bodies" 
            :key="body.id" 
            :src="body.src"
            :style="{
                width: `${body.width}px`,
                width: `${body.height}px`, 
                transform: `translate(${body.x - body.width/2}px, ${body.y - body.height/2}px) rotate(${body.angle}rad)`
            }"
         />
    </div>
</template>

<script>
import Matter from 'matter-js'
import { EmoteService } from '../utils/emotes.js'

const Engine = Matter.Engine;
const Render = Matter.Render;
const Runner = Matter.Runner;
const Body = Matter.Body;
const Events = Matter.Events;
const Composite = Matter.Composite;
const Composites = Matter.Composites;
const Common = Matter.Common;
const MouseConstraint = Matter.MouseConstraint;
const Mouse = Matter.Mouse;
const World = Matter.World;
const Bodies = Matter.Bodies;
export default {
    inject: ['isEditor'],
    props: {
    },
    widget: {
        name: "Emote Bouncer",
        description: "Any emotes or emojis in chat will bounce around.",
        icon: "mdi-emoticon",
        defaultSize: {
            width: 1920,
            height: 1080
        },
    },
    data() {
        return {
            bodies: [],
            spawnId: 1,
        }
    },
    methods: {
        onTwitchChat(chat) {
            const emotes = this.emotes.parseMessage(chat)

            if (emotes) {
                for (let emote of emotes) {
                    this.spawnImage(emote);
                }
            }
        },
        updateBodyVDom() {
            const bodies = Composite.allBodies(this.engine.world)

            for (let body of bodies) {
                if (body.vueId) {
                    const vueBody = this.bodies.find(b => b.id == body.vueId)

                    vueBody.x = body.position.x;
                    vueBody.y = body.position.y;
                    vueBody.angle = body.angle;
                }
            }
        },
        shake() {
            if (this.isEditor)
                return;

            const bodies = Composite.allBodies(this.engine.world);

            for (let body of bodies) {
                if (!body.isStatic) {
                    const forceMagnitude = 0.02 * body.mass;

                    Body.applyForce(body, body.position, {
                        x: (forceMagnitude + Common.random() * forceMagnitude) * Common.choose([1, -1]),
                        y: -forceMagnitude + Common.random() * -forceMagnitude
                    });
                }
            }
        },
        spawnImage(image) {
            const width = this.$refs.bounceHouse.clientWidth;
            const height = this.$refs.bounceHouse.clientHeight;

            let x = Math.random() * width;
            let y = Math.random() * height;

            const velocityMax = 0.4;
            let velX = (Math.random() - 0.5) * velocityMax;
			let velY = (Math.random() - 0.5) * velocityMax;

            const id = this.spawnId++;

            this.bodies.push({
                src: image,
                id,
                width: 80,
                height: 80,
                x,
                y,
                angle: 0
            })

            const circleBody = Bodies.circle(x, y, 40, {});
            circleBody.vueId = id

            Body.applyForce(circleBody, { x, y }, { x: velX, y: velY });

            World.add(this.engine.world, [circleBody]);

            const lifetime = 7;
            setTimeout(() => {
                World.remove(this.engine.world, circleBody);

                const idx = this.bodies.findIndex(b => b.id == id)
                if (idx >= 0) {
                    this.bodies.splice(idx, 1)
                }
            }, lifetime * 1000)
        }
    },
    mounted() {
        const width = this.$refs.bounceHouse.clientWidth;
        const height = this.$refs.bounceHouse.clientHeight;

        console.log("Mounting Bounce House", Matter, width, height)

        if (this.isEditor)
            return;

        this.emotes = new EmoteService();

        this.engine = Engine.create();

        const ground = Bodies.rectangle(width / 2, height + 40, width, 80, { isStatic: true });
        const ceiling = Bodies.rectangle(width / 2, -40, width, 80, { isStatic: true });
        const leftWall = Bodies.rectangle(-40, height / 2, 80, height, { isStatic: true });
        const rightWall = Bodies.rectangle(width + 40, height / 2, 80, height, { isStatic: true });

        World.add(this.engine.world, [ground, ceiling, leftWall, rightWall]);

		Engine.run(this.engine);

        Events.on(this.engine, 'beforeUpdate', (event) => {
            // apply random forces every 5 secs
            if (event.timestamp % 5000 < 50)
                this.shake();
            
            this.updateBodyVDom();
        });
    }
}
</script>

<style scoped>
.bounce-house {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

.bouncey-body {
    position: absolute
}
</style>