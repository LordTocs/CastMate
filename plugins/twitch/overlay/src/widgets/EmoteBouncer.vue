<template>
	<div class="bounce-house" ref="bounceHouse">
		<img
			class="bouncey-body"
			v-for="body in bouncingEmotes"
			:key="body.bodyId"
			:src="body.imageUrl"
			:style="{
				width: `${body.width}px`,
				height: `${body.height}px`,
				transform: `translate(${body.x - body.width / 2}px, ${body.y - body.height / 2}px) rotate(${
					body.angle
				}rad)`,
			}"
		/>
		<!-- <template v-if="isEditor && useLaunchPosition">
			<div
				class="launch-indicator"
				:style="{
					top: `${launchParameters?.launchY || 0 - 1}px`,
					left: `${launchParameters?.launchX || 0 - 1}px`,
				}"
			>
				<div
					class="launch-cone"
					:style="{
						top: `calc(50% - ${launchHeight / 2}px)`,
						left: `50%`,
						transform: `rotate(${launchParameters.angle || 0}deg)`,
						clipPath: `path('${launchClipPath}')`,
						width: `${launchWidth}px`,
						height: `${launchHeight}px`,
					}"
				></div>
			</div>
		</template> -->
	</div>
</template>

<script setup lang="ts">
import Matter, { Engine, Body, Bodies, World, Runner, Events, Composite, Vertices } from "matter-js"

import { declareWidgetOptions, handleOverlayMessage } from "castmate-overlay-core"
import { Duration } from "castmate-schema"
import { OverlayWidgetSize } from "castmate-plugin-overlays-shared"
import { Range } from "castmate-schema"
import { onMounted, ref } from "vue"

import { EmoteParsedString } from "castmate-plugin-twitch-shared"

defineOptions({
	widget: declareWidgetOptions({
		id: "emote-bounce",
		name: "Emote Bouncer",
		icon: "mdi mdi-emoticon",
		defaultSize: { width: "canvas", height: "canvas" },
		config: {
			type: Object,
			properties: {
				lifeTime: { type: Range, required: true, default: { min: 7, max: 7 }, name: "Emote Life Time" },
				shakeTime: { type: Duration, required: true, default: 5, name: "Time Between Shakes" },
			},
		},
	}),
})

const props = defineProps<{
	size: OverlayWidgetSize
	config: {
		lifetime: Range
		shakeTime: Duration
	}
}>()

const bounceHouse = ref<HTMLElement>()

let engine: Engine
let ground: Body
let ceiling: Body
let leftWall: Body
let rightWall: Body
let runner: Runner

const lastTimestamp = ref(0)

onMounted(() => {
	if (!bounceHouse.value) return

	const width = bounceHouse.value.clientWidth
	const height = bounceHouse.value.clientHeight

	console.log("Mounting Bounce House", Matter, width, height)

	//if is editor stop

	engine = Engine.create()

	ground = Bodies.rectangle(width / 2, height + 40, width, 80, {
		isStatic: true,
	})
	ceiling = Bodies.rectangle(width / 2, -40, width, 80, {
		isStatic: true,
	})
	leftWall = Bodies.rectangle(-40, height / 2, 80, height, {
		isStatic: true,
	})
	rightWall = Bodies.rectangle(width + 40, height / 2, 80, height, {
		isStatic: true,
	})

	World.add(engine.world, [ground, ceiling, leftWall, rightWall])

	runner = Runner.run(engine)

	Events.on(engine, "beforeUpdate", (event) => {
		if (props.config.shakeTime > 0 && event.timestamp % Math.ceil(props.config.shakeTime * 1000) < 50) shake()

		lastTimestamp.value = event.timestamp
		updateBodyVDom()
	})
})

function shake() {}

function setNewRectangle(body: Body, x: number, y: number, width: number, height: number) {
	Body.setPosition(body, { x, y })
	Body.setVertices(
		body,
		Vertices.fromPath("L 0 0 L " + width + " 0 L " + width + " " + height + " L 0 " + height, body)
	)
}

interface BouncingEmote {
	x: number
	y: number
	width: number
	height: number
	imageUrl: string
	angle: number
	bodyId: number
}

const bouncingEmotes = ref<BouncingEmote[]>([])

function updateBodyVDom() {
	const bodies = Composite.allBodies(engine.world)

	for (let body of bodies) {
		const vueBody = bouncingEmotes.value.find((b) => b.bodyId == body.id)
		if (!vueBody) continue

		vueBody.x = body.position.x
		vueBody.y = body.position.y
		vueBody.angle = body.angle
	}
}

function spawnImage(image: string, aspectRatio: number) {
	const spawnAreaWidth = props.size.width
	const spawnAreaHeight = props.size.height

	let x = Math.random() * spawnAreaWidth
	let y = Math.random() * spawnAreaHeight

	// if (this.useLaunchPosition) {
	// 	x = this.launchParameters?.launchX ?? 0
	// 	y = this.launchParameters?.launchY ?? 0
	// }

	const velocityMax = 0.4
	let velX = (Math.random() - 0.5) * velocityMax
	let velY = (Math.random() - 0.5) * velocityMax

	// if (this.useLaunchPosition) {
	// 	const angle =
	// 		Number(this.launchParameters?.angle) +
	// 		(Math.random() - 0.5) *
	// 			Number(this.launchParameters?.spread)

	// 	velX = Math.cos((angle * Math.PI) / 180) * velocityMax
	// 	velY = Math.sin((angle * Math.PI) / 180) * velocityMax
	// }

	const height = 80
	const width = height / aspectRatio

	const circleBody = Bodies.circle(x, y, height / 2, {})

	const bouncer: BouncingEmote = {
		bodyId: circleBody.id,
		imageUrl: image,
		width,
		height,
		angle: 0,
		x,
		y,
	}

	bouncingEmotes.value.push(bouncer)

	//circleBody.vueId = id

	Body.applyForce(circleBody, { x, y }, { x: velX, y: velY })

	World.add(engine.world, [circleBody])

	const lifetime = 7 //props.config.lifetime.min || 7

	setTimeout(() => {
		World.remove(engine.world, circleBody)
		const idx = bouncingEmotes.value.findIndex((b) => b.bodyId == circleBody.id)
		if (idx >= 0) {
			bouncingEmotes.value.splice(idx, 1)
		}
	}, lifetime * 1000)
}

handleOverlayMessage("twitch_message", (message: EmoteParsedString) => {
	for (const chunk of message) {
		console.log("Chunk", chunk)
		if (chunk.type == "emote") {
			const img =
				chunk.emote.urls.url4x ?? chunk.emote.urls.url3x ?? chunk.emote.urls.url2x ?? chunk.emote.urls.url1x

			if (!img) continue
			spawnImage(img, chunk.emote.aspectRatio)
		}
	}
})
/*
export default {
	inject: ["isEditor", "stateProvider"],
	props: {
		size: { type: Object },
		lifetime: { type: Number, name: "Emote Life Time", default: 7 },
		velocityMax: { type: Number, name: "Max Velocity", default: 0.4 },
		shakeTime: { type: Number, name: "Time Between Shakes", default: 5 },
		useLaunchPosition: {
			type: Boolean,
			name: "Use Launch Parameters",
			default: false,
		},
		launchParameters: {
			type: Object,
			name: "Launch Parameters",
			properties: {
				launchX: { type: Number, name: "X Position" },
				launchY: { type: Number, name: "Y Position" },
				angle: { type: Number, name: "Angle" },
				spread: { type: Number, name: "Angle Spread" },
			},
		},
	},
	computed: {
		...mapCastMateState("twitch", ["channelId", "channelName"]),
		launchWidth() {
			return 400 * this.velocityMax
		},
		launchHeight() {
			return (
				this.launchWidth *
				Math.sin(
					((this.launchParameters?.spread || 0) * Math.PI) / 180 / 2
				) *
				2
			)
		},
		launchClipPath() {
			const radius = this.launchWidth
			const spread = this.launchParameters?.spread || 0
			const theta = (spread * Math.PI) / 180 / 2
			const cosTheta = Math.cos(theta)
			const sinTheta = Math.sin(theta)

			const width = this.launchWidth
			const height = this.launchHeight

			const arcPath = `M 0,${height / 2 - 1} L${
				cosTheta * width
			},-1 A ${radius},${radius} ${spread} 0, 1, ${cosTheta * width}, ${
				height + 1
			} L 0,${height / 2 + 1} Z`

			return arcPath
		},
	},
	methods: {
		onTwitchChat(chat) {
			const emotes = this.emotes.parseMessage(chat)

			if (emotes) {
				for (let emote of emotes) {
					this.spawnImage(emote)
				}
			}
		},
		updateBodyVDom() {
			const bodies = Composite.allBodies(this.engine.world)

			for (let body of bodies) {
				if (body.vueId) {
					const vueBody = this.bodies.find((b) => b.id == body.vueId)

					vueBody.x = body.position.x
					vueBody.y = body.position.y
					vueBody.angle = body.angle
				}
			}
		},
		shake() {
			if (this.isEditor) return

			const bodies = Composite.allBodies(this.engine.world)

			for (let body of bodies) {
				if (!body.isStatic) {
					const forceMagnitude = 0.02 * body.mass

					Body.applyForce(body, body.position, {
						x:
							(forceMagnitude +
								Common.random() * forceMagnitude) *
							Common.choose([1, -1]),
						y: -forceMagnitude + Common.random() * -forceMagnitude,
					})
				}
			}
		},
		spawnImage(image) {
			const width = this.size.width
			const height = this.size.height

			let x = Math.random() * width
			let y = Math.random() * height

			if (this.useLaunchPosition) {
				x = this.launchParameters?.launchX ?? 0
				y = this.launchParameters?.launchY ?? 0
			}

			const velocityMax = this.velocityMax ?? 0.4
			let velX = (Math.random() - 0.5) * velocityMax
			let velY = (Math.random() - 0.5) * velocityMax

			if (this.useLaunchPosition) {
				const angle =
					Number(this.launchParameters?.angle) +
					(Math.random() - 0.5) *
						Number(this.launchParameters?.spread)

				velX = Math.cos((angle * Math.PI) / 180) * velocityMax
				velY = Math.sin((angle * Math.PI) / 180) * velocityMax
			}

			const id = this.spawnId++

			this.bodies.push({
				src: image,
				id,
				width: 80,
				height: 80,
				x,
				y,
				angle: 0,
			})

			const circleBody = Bodies.circle(x, y, 40, {})
			circleBody.vueId = id

			Body.applyForce(circleBody, { x, y }, { x: velX, y: velY })

			World.add(this.engine.world, [circleBody])

			const lifetime = this.lifetime || 7
			setTimeout(() => {
				World.remove(this.engine.world, circleBody)

				const idx = this.bodies.findIndex((b) => b.id == id)
				if (idx >= 0) {
					this.bodies.splice(idx, 1)
				}
			}, lifetime * 1000)
		},
		setNewRectangle(body, x, y, width, height) {
			Body.setPosition(body, { x, y})
			Body.setVertices(body, Vertices.fromPath('L 0 0 L ' + width + ' 0 L ' + width + ' ' + height + ' L 0 ' + height))
		},
		updateWalls() {
			if (this.isEditor) return

			const width = this.size.width
			const height = this.size.height
			this.setNewRectangle(this.ground, width / 2, height + 40, width, 80)
			this.setNewRectangle(this.ceiling, width / 2, -40, width, 80)
			this.setNewRectangle(this.leftWall, -40, height / 2, 80, height)
			this.setNewRectangle(this.rightWall, width + 40, height / 2, 80, height)
		}
	},
	mounted() {

	},
	watch: {
		channelId() {
			this.emotes?.updateChannelId(this.channelId)
		},
		channelName() {
			this.emotes?.updateChannelName(this.channelName)
		},
		size: {
			deep: true,
			handler() {
				this.updateWalls()
			}
		}
	},
}*/
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
	position: absolute;
}

.launch-indicator {
	position: absolute;
	width: 2px;
	height: 2px;
	border-radius: 100%;
	background-color: red;
}

.launch-cone {
	position: relative;
	transform-origin: center left;
	background-image: linear-gradient(to right, #ff000080, transparent);
}
</style>
