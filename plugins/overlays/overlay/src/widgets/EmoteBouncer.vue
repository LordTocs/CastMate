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
import Matter, { Engine, Body, Bodies, World, Runner, Events, Composite, Vertices, Common } from "matter-js"

import { declareWidgetOptions, handleOverlayMessage, handleOverlayRPC, useIsEditor } from "castmate-overlay-core"
import { Duration, EmoteInfo, EmoteParsedString } from "castmate-schema"
import { OverlayWidgetSize } from "castmate-plugin-overlays-shared"
import { Range } from "castmate-schema"
import { onMounted, ref, watch } from "vue"

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
				emoteSize: {
					type: Range,
					name: "Emote Size",
					default: { min: 80, max: 80 },
					required: true,
				},
				velocityMax: {
					type: Number,
					name: "Launch Velocity Max",
					default: 0.4,
					template: true,
					required: true,
				},
				shakeTime: {
					type: Number,
					name: "Time Between Shakes",
					default: 5,
					template: true,
					required: true,
				},
				shakeStrength: {
					type: Number,
					name: "Shake Strength Multiplier",
					default: 1,
					template: true,
					required: true,
				},
				gravityXScale: {
					type: Number,
					name: "Gravity X Scale",
					default: 0.0,
					template: true,
					required: true,
				},
				gravityYScale: {
					type: Number,
					name: "Gravity Y Scale",
					default: 1.0,
					template: true,
					required: true,
				},
				spamPrevention: {
					type: Object,
					name: "Spam Prevention",
					properties: {
						emoteRatio: {
							type: Number,
							name: "Emote Ratio",
							default: 1,
							required: true,
						},
						emoteCap: {
							type: Number,
							name: "Total Emote Cap",
						},
						emoteCapPerMessage: {
							type: Number,
							name: "Max Emotes per Chat Message",
						},
					},
				},
			},
		},
	}),
})

const props = defineProps<{
	size: OverlayWidgetSize
	config: {
		lifeTime: Range
		emoteSize: Range
		velocityMax: number
		shakeTime: Duration
		shakeStrength: number
		gravityXScale: number
		gravityYScale: number
		spamPrevention: {
			emoteRatio: number
			emoteCap: number | undefined
			emoteCapPerMessage: number | undefined
		}
	}
}>()

const isEditor = useIsEditor()

const bounceHouse = ref<HTMLElement>()

let engine: Engine
let ground: Body
let ceiling: Body
let leftWall: Body
let rightWall: Body
let runner: Runner

const lastTimestamp = ref(0)
const nextShakeTime = ref(0)

onMounted(() => {
	if (!bounceHouse.value) return
	if (isEditor) return

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

	engine.gravity.x = props.config.gravityXScale ?? 0
	engine.gravity.y = props.config.gravityYScale ?? 1

	runner = Runner.run(engine)

	Events.on(engine, "beforeUpdate", (event) => {
		if (nextShakeTime.value == 0) {
			nextShakeTime.value = event.timestamp + props.config.shakeTime * 1000
		}

		if (event.timestamp > nextShakeTime.value) {
			nextShakeTime.value = event.timestamp + props.config.shakeTime * 1000
			shake()
		}

		lastTimestamp.value = event.timestamp
		updateBodyVDom()
	})
})

function setNewRectangle(body: Body, x: number, y: number, width: number, height: number) {
	if (isEditor) return

	Body.setPosition(body, { x, y })
	Body.setVertices(
		body,
		Vertices.fromPath("L 0 0 L " + width + " 0 L " + width + " " + height + " L 0 " + height, body)
	)
}

watch(
	() => props.size,
	() => {
		const width = props.size.width
		const height = props.size.height
		setNewRectangle(ground, width / 2, height + 40, width, 80)
		setNewRectangle(ceiling, width / 2, -40, width, 80)
		setNewRectangle(leftWall, -40, height / 2, 80, height)
		setNewRectangle(rightWall, width + 40, height / 2, 80, height)
	}
)

watch(
	() => props.config.gravityXScale,
	() => {
		if (!engine) return
		engine.gravity.x = props.config?.gravityXScale ?? 0
	}
)

watch(
	() => props.config.gravityYScale,
	() => {
		if (!engine) return
		engine.gravity.y = props.config?.gravityYScale ?? 1
	}
)

function shake() {
	const bodies = Composite.allBodies(engine.world)

	for (let body of bodies) {
		if (!body.isStatic) {
			const forceMagnitude = 0.02 * body.mass * (props.config.shakeStrength ?? 1.0)

			//Warp force to be opposed to gravity
			const gravity = {
				x: engine.gravity.x,
				y: engine.gravity.y,
			}
			const gravityMag = Math.sqrt(gravity.x * gravity.x + gravity.y * gravity.y)

			if (gravityMag > 0) {
				const forceX = Common.random(-1, 1) * forceMagnitude
				const forceY = Common.random(0, 2) * -forceMagnitude

				gravity.x /= gravityMag
				gravity.y /= gravityMag

				const gravityTangent = { x: -gravity.y, y: gravity.x }

				const gravityAlignedForce = {
					x: forceX * gravityTangent.x + forceY * gravity.x,
					y: forceX * gravityTangent.y + forceY * gravity.y,
				}

				Body.applyForce(body, body.position, {
					x: gravityAlignedForce.x,
					y: gravityAlignedForce.y,
				})
			} else {
				const forceX = Common.random(-2, 2) * forceMagnitude
				const forceY = Common.random(-2, 2) * -forceMagnitude

				Body.applyForce(body, body.position, {
					x: forceX,
					y: forceY,
				})
			}
		}
	}
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

interface SpawnInfo {
	imageUrl: string
	width: number
	height: number
	x: number
	y: number
	angle: number
	velX: number
	velY: number
	angularVel: number
	lifetime: number
}

const bodyMap = new Map<number, { body: Body; timeout: NodeJS.Timeout }>()

function despawn(id: number) {
	if (isEditor) return

	const bodyInfo = bodyMap.get(id)

	if (!bodyInfo) return

	clearTimeout(bodyInfo.timeout)

	World.remove(engine.world, bodyInfo.body)

	const idx = bouncingEmotes.value.findIndex((e) => e.bodyId == id)
	if (idx >= 0) {
		bouncingEmotes.value.splice(idx, 1)
	}

	bodyMap.delete(id)
}

function spawn(info: SpawnInfo) {
	if (isEditor) return 0

	if (props.config.spamPrevention.emoteCap != null) {
		while (bouncingEmotes.value.length >= props.config.spamPrevention.emoteCap) {
			despawn(bouncingEmotes.value[0].bodyId)
		}
	}

	const body = Bodies.circle(info.x, info.y, info.height / 2, {})
	const bouncer: BouncingEmote = {
		bodyId: body.id,
		imageUrl: info.imageUrl,
		width: info.width,
		height: info.height,
		angle: 0,
		x: info.x,
		y: info.y,
	}

	bouncingEmotes.value.push(bouncer)
	Body.applyForce(body, { x: info.x, y: info.y }, { x: info.velX, y: info.velY })
	World.add(engine.world, [body])

	const timeout = setTimeout(() => {
		despawn(body.id)
	}, info.lifetime * 1000)

	bodyMap.set(body.id, { body, timeout })

	return body.id
}

function getDefaultSpawnInfo() {
	const spawnAreaWidth = props.size.width
	const spawnAreaHeight = props.size.height

	let x = Math.random() * spawnAreaWidth
	let y = Math.random() * spawnAreaHeight

	let velX = (Math.random() - 0.5) * props.config.velocityMax
	let velY = (Math.random() - 0.5) * props.config.velocityMax

	const angle = 0
	const angularVel = 0

	const lifetime = Range.random(props.config.lifeTime)

	return {
		x,
		y,
		velX,
		velY,
		angle,
		angularVel,
		lifetime,
	}
}

function spawnEmote(emote: EmoteInfo) {
	const imageUrl = emote.urls.url4x ?? emote.urls.url3x ?? emote.urls.url2x ?? emote.urls.url1x

	if (!imageUrl) return -1

	const height = Range.random(props.config.emoteSize)
	const width = height / emote.aspectRatio

	return spawn({
		imageUrl,
		width,
		height,
		...getDefaultSpawnInfo(),
	})
}

handleOverlayMessage("twitch_message", (message: EmoteParsedString) => {
	let spawned = 0
	for (let i = 0; i < props.config.spamPrevention.emoteRatio; ++i) {
		for (const chunk of message) {
			if (chunk.type == "emote") {
				spawnEmote(chunk.emote)
				spawned++
				if (spawned === props.config.spamPrevention.emoteCapPerMessage) return
			}
		}
	}
})

handleOverlayRPC("spawnEmotes", (message: EmoteParsedString) => {
	for (const chunk of message) {
		if (chunk.type == "emote") {
			spawnEmote(chunk.emote)
		}
	}
})
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
