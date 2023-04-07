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
				transform: `translate(${body.x - body.width / 2}px, ${
					body.y - body.height / 2
				}px) rotate(${body.angle}rad)`,
			}"
		/>
		<template v-if="isEditor && useLaunchPosition">
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
		</template>
	</div>
</template>

<script>
import Matter from "matter-js"
import { EmoteService } from "../utils/emotes.js"
import { mapCastMateState } from "../utils/castmate-state.js"

const Engine = Matter.Engine
const Render = Matter.Render
const Runner = Matter.Runner
const Body = Matter.Body
const Events = Matter.Events
const Composite = Matter.Composite
const Composites = Matter.Composites
const Common = Matter.Common
const MouseConstraint = Matter.MouseConstraint
const Mouse = Matter.Mouse
const World = Matter.World
const Bodies = Matter.Bodies
const Vertices = Matter.Vertices
export default {
	inject: ["isEditor", "stateProvider"],
	props: {
		size: { type: Object },
		lifetime: {
			type: Number,
			name: "Emote Life Time",
			default: 7,
			template: true,
		},
		emoteSize: {
			type: Range,
			name: "Emote Size",
			default: () => ({ min: 80, max: 80 }),
			template: true,
		},
		velocityMax: {
			type: Number,
			name: "Launch Velocity Max",
			default: 0.4,
			template: true,
		},
		shakeTime: {
			type: Number,
			name: "Time Between Shakes",
			default: 5,
			template: true,
		},
		shakeStrength: {
			type: Number,
			name: "Shake Strength Multiplier",
			default: 1,
			template: true,
		},
		gravityXScale: {
			type: Number,
			name: "Gravity X Scale",
			default: 0.0,
			template: true,
		},
		gravityYScale: {
			type: Number,
			name: "Gravity Y Scale",
			default: 1.0,
			template: true,
		},
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
		spamPrevention: {
			type: Object,
			name: "Spam Prevention",
			properties: {
				emoteRatio: {
					type: Number,
					name: "Emote Ratio",
					default: 1,
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
	widget: {
		name: "Emote Bouncer",
		description: "Any emotes or emojis in chat will bounce around.",
		icon: "mdi-emoticon",
		defaultSize: {
			width: 1920,
			height: 1080,
		},
	},
	data() {
		return {
			bodies: [],
			emoteRatioCounts: {},
			spawnId: 1,
		}
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

			const emoteRatio = this.spamPrevention?.emoteRatio ?? 1
			const emoteCap = this.spamPrevention?.emoteCap ?? 0
			const emoteCapPerMessage =
				this.spamPrevention?.emoteCapPerMessage ?? 0

			let spawnedThisMessage = 0

			const doChatSpawn = (emote) => {
				const bodyCount = this.bodies.length //There are 4 static bodies.
				if (emoteCap > 0 && bodyCount >= emoteCap) {
					//Remove the first element that isn't static.
					this.destroyBody(this.bodies[0].id)
				}

				if (
					emoteCapPerMessage > 0 &&
					spawnedThisMessage >= emoteCapPerMessage
				) {
					return
				}

				this.spawnImage(emote)
				spawnedThisMessage++
			}

			if (emotes) {
				for (let emote of emotes) {
					if (emoteRatio == 1) {
						doChatSpawn(emote)
					} else {
						this.emoteRatioCounts[emote] =
							(this.emoteRatioCounts[emote] ?? 0) + 1

						if (this.emoteRatioCounts[emote] >= emoteRatio) {
							doChatSpawn(emote)
							this.emoteRatioCounts[emote] = 0
						}
					}
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
					const forceMagnitude =
						0.02 * body.mass * (this.shakeStrength ?? 1.0)

					//Warp force to be opposed to gravity
					const gravity = {
						x: this.engine.gravity.x,
						y: this.engine.gravity.y,
					}
					const gravityMag = Math.sqrt(
						gravity.x * gravity.x + gravity.y * gravity.y
					)

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
		},
		destroyBody(id) {
			if (!this.bodyMap.has(id)) return

			const { body, timeout } = this.bodyMap.get(id)

			World.remove(this.engine.world, body)

			const idx = this.bodies.findIndex((b) => b.id == id)
			if (idx >= 0) {
				this.bodies.splice(idx, 1)
			}

			clearTimeout(timeout)

			this.bodyMap.delete(id)
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
					Number(this.launchParameters?.angle ?? 0) +
					(Math.random() - 0.5) *
						Number(this.launchParameters?.spread ?? 25)

				velX = Math.cos((angle * Math.PI) / 180) * velocityMax
				velY = Math.sin((angle * Math.PI) / 180) * velocityMax
			}

			const id = this.spawnId++

			let imgWidth = Common.random(
				this.emoteSize?.min ?? 80,
				this.emoteSize?.max ?? 80
			)
			if (imgWidth == 0) {
				imgWidth = 80
			}
			let imgHeight = imgWidth

			this.bodies.push({
				src: image,
				id,
				width: imgWidth,
				height: imgHeight,
				x,
				y,
				angle: 0,
			})

			const circleBody = Bodies.circle(x, y, imgWidth / 2, {})
			circleBody.vueId = id

			Body.applyForce(circleBody, { x, y }, { x: velX, y: velY })

			World.add(this.engine.world, [circleBody])

			const lifetime = this.lifetime || 7
			const timeout = setTimeout(() => {
				this.destroyBody(id)
			}, lifetime * 1000)

			this.bodyMap.set(id, { body: circleBody, timeout })
		},
		setNewRectangle(body, x, y, width, height) {
			Body.setPosition(body, { x, y })
			Body.setVertices(
				body,
				Vertices.fromPath(
					"L 0 0 L " +
						width +
						" 0 L " +
						width +
						" " +
						height +
						" L 0 " +
						height
				)
			)
		},
		updateWalls() {
			if (this.isEditor) return

			const width = this.size.width
			const height = this.size.height
			this.setNewRectangle(this.ground, width / 2, height + 40, width, 80)
			this.setNewRectangle(this.ceiling, width / 2, -40, width, 80)
			this.setNewRectangle(this.leftWall, -40, height / 2, 80, height)
			this.setNewRectangle(
				this.rightWall,
				width + 40,
				height / 2,
				80,
				height
			)
		},
	},
	mounted() {
		const width = this.$refs.bounceHouse.clientWidth
		const height = this.$refs.bounceHouse.clientHeight

		console.log("Mounting Bounce House", Matter, width, height)

		if (this.isEditor) return

		this.bodyMap = new Map()

		this.emotes = new EmoteService(this.channelId, this.channelName)

		this.engine = Engine.create()

		this.ground = Bodies.rectangle(width / 2, height + 40, width, 80, {
			isStatic: true,
		})
		this.ceiling = Bodies.rectangle(width / 2, -40, width, 80, {
			isStatic: true,
		})
		this.leftWall = Bodies.rectangle(-40, height / 2, 80, height, {
			isStatic: true,
		})
		this.rightWall = Bodies.rectangle(width + 40, height / 2, 80, height, {
			isStatic: true,
		})

		World.add(this.engine.world, [
			this.ground,
			this.ceiling,
			this.leftWall,
			this.rightWall,
		])

		this.engine.gravity.x = this.gravityXScale ?? 0
		this.engine.gravity.y = this.gravityYScale ?? 1.0

		Engine.run(this.engine)

		Events.on(this.engine, "beforeUpdate", (event) => {
			if (
				this.shakeTime > 0 &&
				event.timestamp % Math.ceil(this.shakeTime * 1000) < 50
			)
				this.shake()

			this.updateBodyVDom()
		})
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
			},
		},
		gravityXScale() {
			this.engine.gravity.x = this.gravityXScale ?? 0
		},
		gravityYScale() {
			this.engine.gravity.y = this.gravityYScale ?? 1.0
		},
	},
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
