import OBSWebSocket from "obs-websocket-js" // For more info: https://www.npmjs.com/package/obs-websocket-js
import { template } from "../state/template.js"
import { app } from "../utils/electronBridge.js"
import ChildProcess from "child_process"
import regedit from "regedit"
import util from "util"
import os from "os"
import { getLocalIP } from "../utils/os.js"

if (app.isPackaged) {
	console.log(
		"Setting External VBS Location",
		regedit.setExternalVBSLocation("resources/regedit/vbs")
	)
} else {
	console.log(
		"Setting External VBS Location",
		regedit.setExternalVBSLocation("./node_modules/regedit/vbs")
	)
}

const OBS_ICON_SVG =
	"svg:M22,12c0,5.523-4.477,10-10,10S2,17.523,2,12S6.477,2,12,2S22,6.477,22,12z M17.802,9.089 c-0.751-0.421-1.557-0.637-2.366-0.678c-0.335,0.62-0.832,1.139-1.438,1.489c-0.598,0.345-1.29,0.525-2.036,0.494 c-0.293-0.012-0.591-0.043-0.865-0.11C9.503,9.832,8.334,8.372,8.352,6.638c0.018-1.872,1.413-3.468,3.213-3.745 c-0.139,0.001-0.274,0.015-0.418,0.024c-2.615,0.43-4.607,2.779-4.569,5.514c0.011,0.861,0.227,1.667,0.596,2.388 c0.705-0.02,1.402,0.151,2.008,0.501c0.598,0.345,1.1,0.855,1.446,1.516c0.136,0.259,0.253,0.511,0.331,0.773 c0.422,1.615-0.258,3.374-1.779,4.231c-1.63,0.92-3.71,0.51-4.85-0.91c0.07,0.12,0.15,0.23,0.23,0.35c1.68,2.05,4.71,2.6,7.06,1.2 c0.74-0.44,1.33-1.03,1.77-1.71c-0.37-0.6-0.57-1.29-0.57-1.99c0-0.69,0.19-1.38,0.59-2.01c0.157-0.247,0.305-0.464,0.488-0.658 c1.186-1.186,3.06-1.482,4.57-0.59c1.612,0.952,2.297,2.958,1.637,4.655c0.069-0.121,0.124-0.245,0.188-0.374 C21.228,13.323,20.189,10.424,17.802,9.089z"

function sliderToDB(slider) {
	if (slider == 1.0) return 0.0
	else if (slider <= 0.0) return -100.0

	//Offset and range to match OBS
	const offset = 6
	const range = 96

	let db =
		-(range + offset) * Math.pow((range + offset) / offset, -slider) +
		offset

	return db
}

export default {
	name: "obs",
	uiName: "OBS",
	icon: OBS_ICON_SVG,
	color: "#607A7F",
	async init() {
		this.obs = new OBSWebSocket()
		this.state.recording = false
		this.state.streaming = false

		this.sceneHistory = []

		this.connectOBS()
		this.obs.on("CurrentProgramSceneChanged", ({ sceneName }) => {
			this.state.scene = sceneName

			if (!this.poppingScene) {
				this.sceneHistory.push(sceneName)

				if (this.sceneHistory.length > 30) {
					this.sceneHistory.splice(0, 1)
				}
			}
			this.poppingScene = false
		})
		this.obs.on("ConnectionClosed", () => {
			this.state.connected = false
			if (!this.forceStop) {
				setTimeout(() => {
					this.connectOBS()
				}, 5000)
			} else {
				this.forceStop = false
			}
		})
		this.obs.on("StreamStateChanged", ({ outputActive }) => {
			this.state.streaming = outputActive
			if (outputActive) {
				this.analytics.track("goLive")
			} else {
				this.analytics.track("streamEnded")
			}
		})

		this.obs.on("RecordStateChanged", ({ outputActive }) => {
			this.state.recording = outputActive
		})

		this.lastPassword = null
		this.lastHostname = null
		this.lastPort = null
		this.installDir =
			this.settings.installDirOverride || (await this.lookupInstallDir())
	},
	async onSettingsReload() {
		const port = this.settings.port || 4455
		const hostname = this.settings.hostname || "localhost"
		const password = this.secrets.password

		if (
			this.lastPort === port &&
			this.lastHostname === hostname &&
			this.lastPassword === password
		) {
			return
		}

		this.forceStop = true
		await this.obs.disconnect()
		await this.connectOBS()
	},
	methods: {
		lookupInstallDir() {
			return new Promise((resolve, reject) => {
				regedit.list("HKLM\\SOFTWARE\\OBS Studio", (err, result) => {
					if (err) return reject(err)

					try {
						const obsPath =
							result["HKLM\\SOFTWARE\\OBS Studio"].values[""]
								.value
						resolve(obsPath)
					} catch {
						resolve(undefined)
					}
				})
			})
		},
		async tryConnect(hostname, port, password) {
			this.lastHostname = hostname
			this.lastPort = port
			this.lastPassword = password

			try {
				await this.obs.connect(`ws://${hostname}:${port}`, password)
				this.logger.info("OBS connected!")

				// Set the current scene
				const { currentProgramSceneName } = await this.obs.call(
					"GetCurrentProgramScene"
				)
				this.state.scene = currentProgramSceneName
				this.sceneHistory = [currentProgramSceneName]

				//Get the stream status
				const streamStatus = await this.obs.call("GetStreamStatus")
				this.state.streaming = streamStatus.outputActive

				const recordStatus = await this.obs.call("GetRecordStatus")
				this.state.recording = recordStatus.outputActive

				this.state.connected = true
				this.analytics.set({ usesOBS: true })

				return true
			} catch (error) {
				//this.logger.error(`Error Connecting to OBS: ws://${hostname}:${port}`);
				//this.logger.error(`Failed to connect ${error.code}: ${error.message}`);
				this.state.connected = false
				return false
			}
		},
		async connectOBS() {
			const port = this.settings.port || 4455
			const hostname = this.settings.hostname || "localhost"
			const password = this.secrets.password
			await this.tryConnect(hostname, port, password)
		},
		async getAllSources(type) {
			try {
				const result = await this.obs.call(
					"GetInputList",
					type ? { inputKind: type } : undefined
				)
				return result.inputs
			} catch {
				return []
			}
		},
		async getSourceFilters(sourceName) {
			try {
				return await this.obs.call("GetSourceFilterList", {
					sourceName,
				})
			} catch {
				return []
			}
		},
		async getSceneSources(sceneName) {
			try {
				const result = await this.obs.call("GetSceneItemList", {
					sceneName,
				})
				return result.sceneItems
			} catch {
				return []
			}
		},
		async getAllScenes() {
			try {
				return await this.obs.call("GetSceneList")
			} catch (err) {
				return []
			}
		},
	},
	ipcMethods: {
		async refreshAllBrowsers() {
			const browsers = await this.getAllSources("browser_source")
			await Promise.all(
				browsers.map((browser) =>
					this.obs.call("PressInputPropertiesButton", {
						inputName: browser.inputName,
						propertyName: "refreshnocache",
					})
				)
			)
		},
		async tryConnectSettings(hostname, port, password) {
			this.forceStop = true
			await this.obs.disconnect()
			return await this.tryConnect(hostname, port, password)
		},
		async openOBS() {
			return await new Promise((resolve, reject) => {
				const startCmd = `Start-Process "${this.installDir}\\bin\\64bit\\obs64.exe" -Verb runAs`
				this.logger.info(`Opening OBS ${startCmd}`)

				if (!this.installDir) return resolve(false)

				try {
					ChildProcess.exec(
						startCmd,
						{
							shell: "powershell.exe",
							cwd: `${this.installDir}\\bin\\64bit\\`,
						},
						(err, stdout, stderr) => {
							console.log(stdout)
							console.error(stderr)
							if (err) {
								console.error(err)
								return resolve(false)
							}
							resolve(true)
						}
					)
				} catch (err) {
					console.error("Error Spawning:", err)
					return reject(err)
				}
			})
		},
		async createNewSource(sourceTypeId, sourceName, sceneName, settings) {
			const { sceneItemId } = await this.obs.call("CreateInput", {
				sceneName,
				inputName: sourceName,
				inputKind: sourceTypeId,
				inputSettings: settings,
			})

			return sceneItemId
		},
		async updateSourceSettings(sourceName, settings) {
			await this.obs.call("SetInputSettings", {
				inputName: sourceName,
				inputSettings: settings,
			})
		},
		async findBrowserByUrlPattern(urlPattern) {
			const { inputs } = await this.obs.call("GetInputList", {
				inputKind: "browser_source",
			})

			const inputSettingsAndName = await Promise.all(
				inputs.map(async (i) => {
					const result = await this.obs.call("GetInputSettings", {
						inputName: i.inputName,
					})
					return { inputName: i.inputName, ...result }
				})
			)

			const urlRegex = new RegExp(urlPattern)

			console.log("Checking Pattern", urlPattern)

			const input = inputSettingsAndName.find((i) => {
				return i.inputSettings.url.match(urlRegex)
			})

			return input
		},
		async getOBSRemoteHost() {
			//Returns the relative hostname to use for overlay urls. This is most likely localhost, but if we're connecting to obs on a different machine
			//We need the local url.
			if (this.settings.hostname.toLowerCase() == "localhost") {
				return "localhost"
			} else {
				return getLocalIP()
			}
		},
	},
	settings: {
		hostname: { type: String, name: "Host Name" },
		port: { type: Number, name: "Port" },
	},
	secrets: {
		password: { type: String, name: "Websocket Password" },
	},
	state: {
		scene: {
			type: String,
			name: "Obs Scene",
			description: "Currently Active OBS Scene",
			async enum() {
				const { scenes } = await this.obs.call("GetSceneList")
				return scenes.map((s) => s.sceneName)
			},
		},
		streaming: {
			type: Boolean,
			name: "Obs Streaming",
			description: "Is OBS currently Streaming?",
		},
		recording: {
			type: Boolean,
			name: "Obs Recording",
			description: "Is OBS currently Recording?",
		},
		connected: {
			type: Boolean,
			name: "Obs Connected",
			description: "Is castmate connected to OBS.",
		},
	},
	actions: {
		scene: {
			name: "OBS Scene",
			description: "Change the OBS scene.",
			icon: "mdi-swap-horizontal-bold",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					scene: {
						type: String,
						template: true,
						required: true,
						async enum() {
							const { scenes } = await this.obs.call(
								"GetSceneList"
							)
							return scenes.map((s) => s.sceneName)
						},
					},
				},
			},
			async handler(sceneData, context) {
				await this.obs.call("SetCurrentProgramScene", {
					sceneName: await template(sceneData.scene, context),
				})
			},
		},
		prevScene: {
			name: "Previous OBS Scene",
			description: "Go back to the previous scene.",
			icon: "mdi-skip-backward",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {},
			},
			async handler() {
				this.sceneHistory.pop()
				const previousScene =
					this.sceneHistory[this.sceneHistory.length - 1]
				if (previousScene) {
					this.poppingScene = true
					await this.obs.call("SetCurrentProgramScene", {
						sceneName: previousScene,
					})
				}
			},
		},
		filter: {
			name: "OBS Filter",
			description: "Enable/Disable OBS filter",
			icon: "mdi-eye",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
						required: true,
						async enum() {
							const { inputs } = await this.obs.call(
								"GetInputList"
							)
							const { scenes } = await this.obs.call(
								"GetSceneList"
							)
							return [
								...inputs.map((i) => i.inputName),
								...scenes.map((s) => s.sceneName),
							]
						},
					},
					filterName: {
						type: String,
						template: true,
						name: "Filter Name",
						required: true,
						async enum({ sourceName }) {
							const { filters } = await this.obs.call(
								"GetSourceFilterList",
								{ sourceName }
							)
							return filters.map((f) => f.filterName)
						},
					},
					filterEnabled: {
						type: "Toggle",
						name: "Filter Enabled",
						required: true,
						default: true,
						trueIcon: "mdi-eye-outline",
						falseIcon: "mdi-eye-off-outline",
					},
				},
			},
			async handler(filterData, context) {
				const sourceName = await template(
					filterData.sourceName,
					context
				)
				const filterName = await template(
					filterData.filterName,
					context
				)

				let enabled = filterData.filterEnabled
				if (enabled == "toggle") {
					const { filterEnabled } = await this.obs.call(
						"GetSourceFilter",
						{ sourceName, filterName }
					)
					enabled = !filterEnabled
				}

				await this.obs.call("SetSourceFilterEnabled", {
					sourceName,
					filterName,
					filterEnabled: enabled,
				})
			},
		},
		source: {
			name: "Source Visibility",
			description: "Change a OBS source's visibilty",
			icon: "mdi-eye",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					scene: {
						name: "Scene",
						type: String,
						template: true,
						required: true,
						async enum() {
							const { scenes } = await this.obs.call(
								"GetSceneList"
							)
							return scenes.map((s) => s.sceneName)
						},
					},
					source: {
						name: "Source",
						type: String,
						template: true,
						required: true,
						async enum({ scene }) {
							this.logger.info("Fetching sources for " + scene)
							const { sceneItems } = await this.obs.call(
								"GetSceneItemList",
								{ sceneName: scene }
							)
							return sceneItems.map((i) => i.sourceName)
						},
					},
					enabled: {
						type: "Toggle",
						name: "Source Visible",
						required: true,
						default: true,
						trueIcon: "mdi-eye-outline",
						falseIcon: "mdi-eye-off-outline",
					},
				},
			},
			async handler(data, context) {
				const sceneName = await template(data.scene, context)
				const sourceName = await template(data.source, context)

				const { sceneItemId } = await this.obs.call("GetSceneItemId", {
					sceneName,
					sourceName,
				})

				let enabled = data.enabled
				if (enabled == "toggle") {
					const { sceneItemEnabled } = await this.obs.call(
						"GetSceneItemEnabled",
						{ sceneName, sceneItemId }
					)
					enabled = !sceneItemEnabled
				}

				await this.obs.call("SetSceneItemEnabled", {
					sceneName,
					sceneItemId,
					sceneItemEnabled: enabled,
				})
			},
		},
		text: {
			name: "OBS Text",
			description: "Change the text in a GDI+ text element.",
			icon: "mdi-form-textbox",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					text: {
						type: String,
						template: true,
						name: "Text",
					},
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
						required: true,
						async enum() {
							const { inputs } = await this.obs.call(
								"GetInputList",
								{ inputKind: "text_gdiplus_v2" }
							)
							return inputs.map((i) => i.inputName)
						},
					},
				},
			},
			async handler(textData, context) {
				const currentSettings = await this.obs.call(
					"GetInputSettings",
					{ inputName: await template(textData.sourceName, context) }
				)
				this.logger.info(
					`Text Input Settings: ${util.inspect(currentSettings)}`
				)

				await this.obs.call("SetInputSettings", {
					inputName: await template(textData.sourceName, context),
					inputSettings: {
						text: await template(textData.text, context),
					},
				})
			},
		},
		mediaAction: {
			name: "Media Controls",
			description: "Play, Pause, and Stop media sources.",
			color: "#607A7F",
			icon: "mdi-play-pause",
			data: {
				type: Object,
				properties: {
					mediaSource: {
						name: "Media Source",
						type: String,
						template: true,
						async enum() {
							let { inputs } = await this.obs.call("GetInputList")
							const media_sources = inputs.filter(
								(s) =>
									s.inputKind == "ffmpeg_source" ||
									s.inputKind == "vlc_source"
							)
							return media_sources.map((s) => s.inputName)
						},
					},
					action: {
						name: "Media Action",
						type: String,
						enum: [
							"Play",
							"Pause",
							"Restart",
							"Stop",
							"Next",
							"Previous",
						],
						required: true,
						default: "Play",
					},
				},
			},
			async handler(mediaControl, context) {
				const inputName = await template(
					mediaControl.mediaSource,
					context
				)

				let mediaAction = null

				if (mediaControl.action == "Play") {
					mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PLAY"
				} else if (mediaControl.action == "Pause") {
					mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PAUSE"
				} else if (mediaControl.action == "Restart") {
					mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_RESTART"
				} else if (mediaControl.action == "Stop") {
					mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_STOP"
				} else if (mediaControl.action == "Next") {
					mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_NEXT"
				} else if (mediaControl.action == "Previous") {
					mediaAction = "OBS_WEBSOCKET_MEDIA_INPUT_ACTION_PREVIOUS"
				}

				this.obs.call("TriggerMediaInputAction", {
					inputName,
					mediaAction,
				})
			},
		},
		changeVolume: {
			name: "Change Volume",
			description: "Changes the volume of an audio source.",
			color: "#607A7F",
			icon: "mdi-volume-source",
			data: {
				type: Object,
				properties: {
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
						required: true,
						async enum() {
							const { inputs } = await this.obs.call(
								"GetInputList"
							)
							return inputs.map((s) => s.inputName)
						},
					},
					volume: {
						type: Number,
						template: true,
						name: "Volume",
						default: 1.0,
						required: true,
						slider: {
							min: 0,
							max: 1.0,
							step: 0.01,
						},
					},
				},
			},
			async handler(data, context) {
				const inputName = await template(data.sourceName, context)
				const db = sliderToDB(data.volume)
				this.logger.info(
					`Setting Volume of ${inputName} to ${data.volume} - ${db}db`
				)
				try {
					this.obs.call("SetInputVolume", {
						inputName,
						inputVolumeDb: db,
					})
				} catch (err) {
					this.logger.error(
						`Error Setting Volume of ${sourceName} to ${db}db`
					)
				}
			},
		},
		mute: {
			name: "Mute/Unmute Source",
			description: "Mutes or unmutes an audio source.",
			color: "#607A7F",
			icon: "mdi-volume-mute",
			data: {
				type: Object,
				properties: {
					sourceName: {
						type: String,
						template: true,
						name: "Source Name",
						required: true,
						async enum() {
							const { inputs } = await this.obs.call(
								"GetInputList"
							)
							return inputs.map((s) => s.inputName)
						},
					},
					muted: {
						type: "Toggle",
						required: true,
						name: "Muted",
						default: true,
						leftLabel: "Un-Muted",
						trueIcon: "mdi-volume-off",
						falseIcon: "mdi-volume-high",
					},
				},
			},
			async handler(data, context) {
				const inputName = await template(data.sourceName, context)

				try {
					let muted = data.muted
					if (muted === "toggle") {
						await this.obs.call("ToggleInputMute", { inputName })
					} else {
						await this.obs.call("SetInputMute", {
							inputName,
							inputMuted: data.muted,
						})
					}
				} catch (err) {
					this.logger.error(
						`Error Muting Source ${sourceName}: \n ${err}`
					)
				}
			},
		},
		hotkey: {
			name: "Trigger Hotkey",
			description: "Invokes an OBS Hotkey",
			color: "#607A7F",
			icon: "mdi-keyboard",
			data: {
				type: Object,
				properties: {
					hotkey: {
						type: String,
						name: "Hotkey",
						async enum() {
							const { hotkeys } = await this.obs.call(
								"GetHotkeyList"
							)
							return hotkeys
						},
					},
				},
			},
			async handler(data) {
				await this.obs.call("TriggerHotkeyByName", {
					hotkeyName: data.hotkey,
				})
			},
		},
		setTransform: {
			name: "Set Source Transform",
			description: "Set's a source's transform",
			color: "#607A7F",
			icon: "mdi-move-resize",
			data: {
				type: Object,
				properties: {
					scene: {
						name: "Scene",
						type: String,
						required: true,
						async enum() {
							const { scenes } = await this.obs.call(
								"GetSceneList"
							)
							return scenes.map((s) => s.sceneName)
						},
					},
					sceneItemId: {
						name: "Source",
						type: String,
						required: true,
						async enum({ scene }) {
							const { sceneItems } = await this.obs.call(
								"GetSceneItemList",
								{ sceneName: scene }
							)
							return sceneItems.map((i) => ({
								name: i.sourceName,
								value: i.sceneItemId,
							}))
						},
					},
					position: {
						name: "Position",
						type: Object,
						properties: {
							x: { name: "X", type: Number, template: true },
							y: { name: "Y", type: Number, template: true },
						},
					},
					rotation: {
						name: "Rotation",
						type: Number,
						template: true,
					},
					scale: {
						name: "Scale",
						type: Object,
						properties: {
							x: { name: "X", type: Number, template: true },
							y: { name: "Y", type: Number, template: true },
						},
					},
					crop: {
						name: "Crop",
						type: Object,
						properties: {
							top: { name: "Top", type: Number, template: true },
							right: {
								name: "Right",
								type: Number,
								template: true,
							},
							bottom: {
								name: "Bottom",
								type: Number,
								template: true,
							},
							left: {
								name: "Left",
								type: Number,
								template: true,
							},
						},
					},
					boundingBox: {
						name: "Bounding Box",
						type: Object,
						properties: {
							boxType: {
								name: "Type",
								type: String,
								enum: [
									{
										name: "No Bounds",
										value: "OBS_BOUNDS_NONE",
									},
									{
										name: "Stretch to bounds",
										value: "OBS_BOUNDS_STRETCH",
									},
									{
										name: "Scale to inner bounds",
										value: "OBS_BOUNDS_SCALE_INNER",
									},
									{
										name: "Scale to outer bounds",
										value: "OBS_BOUNDS_SCALE_OUTER",
									},
									{
										name: "Scale to width of bounds",
										value: "OBS_BOUNDS_SCALE_TO_WIDTH",
									},
									{
										name: "Scale to height of bounds",
										value: "OBS_BOUNDS_SCALE_TO_HEIGHT",
									},
									{
										name: "Maximum size only",
										value: "OBS_BOUNDS_MAX_ONLY",
									},
								],
							},
							alignment: {
								name: "Alignment",
								type: Number,
								// See https://github.com/obsproject/obs-studio/blob/master/libobs/obs-defs.h
								enum: [
									{ name: "Top Left", value: 4 | 1 },
									{ name: "Top Center", value: 4 },
									{ name: "Top Right", value: 4 | 2 },
									{ name: "Center Left", value: 1 },
									{ name: "Center", value: 0 },
									{ name: "Center Right", value: 2 },
									{ name: "Bottom Left", value: 8 | 1 },
									{ name: "Bottom Center", value: 8 },
									{ name: "Bottom Right", value: 8 | 2 },
								],
							},
							width: {
								name: "Width",
								type: Number,
								template: true,
							},
							height: {
								name: "Height",
								type: Number,
								template: true,
							},
						},
					},
				},
			},
			async handler(data, context) {
				const sceneName = await template(data.scene, context)
				//const sourceName = await template(data.source, context)
				const sceneItemId = data.sceneItemId

				if (!sceneName || !sceneItemId) return

				const { sceneItemTransform } = await this.obs.call(
					"GetSceneItemTransform",
					{ sceneName, sceneItemId }
				)

				const applyTemplateValue = async (propName, templateValue) => {
					if (templateValue == undefined || templateValue == null)
						return
					let value = templateValue
					if (typeof value === "string" || value instanceof String) {
						value = await template(value, context)
					}
					sceneItemTransform[propName] = Number(value)
				}

				const applyValue = (propName, value) => {
					if (value == undefined || value == null) return
					sceneItemTransform[propName] = value
				}

				await Promise.all([
					applyTemplateValue("positionX", data?.position?.x),
					applyTemplateValue("positionY", data?.position?.y),
					applyTemplateValue("rotation", data?.rotation),
					applyTemplateValue("scaleX", data?.scale?.x),
					applyTemplateValue("scaleY", data?.scale?.y),
					applyTemplateValue("cropBottom", data?.crop?.bottom),
					applyTemplateValue("cropLeft", data?.crop?.left),
					applyTemplateValue("cropRight", data?.crop?.right),
					applyTemplateValue("cropTop", data?.crop?.top),
					applyTemplateValue("boundsWidth", data?.boundingBox?.width),
					applyTemplateValue(
						"boundsHeight",
						data?.boundingBox?.height
					),
				])

				applyValue("boundsType", data?.boundingBox?.boxType)
				applyValue("boundsAlignment", data?.boundingBox?.alignment)

				sceneItemTransform.boundsWidth = Math.max(
					sceneItemTransform.boundsWidth,
					1.0
				)
				sceneItemTransform.boundsHeight = Math.max(
					sceneItemTransform.boundsWidth,
					1.0
				)

				await this.obs.call("SetSceneItemTransform", {
					sceneName,
					sceneItemId,
					sceneItemTransform,
				})
			},
		},
		streamStartStop: {
			name: "Stream Start/Stop",
			description: "Start or Stop Streaming",
			icon: "mdi-broadcast",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					streaming: {
						type: "Toggle",
						name: "Streaming",
						required: true,
						default: true,
						trueIcon: "mdi-broadcast",
						falseIcon: "mdi-broadcast-off",
					},
				},
			},
			async handler(data, context) {
				let enabled = data.streaming
				if (enabled == "toggle") {
					await this.obs.call("ToggleStream")
				} else {
					if (enabled) {
						await this.obs.call("StartStream")
					} else {
						await this.obs.call("StopStream")
					}
				}
			},
		},
		recordingStartStop: {
			name: "Recording Start/Stop",
			description: "Start or Stop Recording",
			icon: "mdi-record",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					recording: {
						type: "Toggle",
						name: "Recording",
						required: true,
						default: true,
						trueIcon: "mdi-record",
						falseIcon: "mdi-stop",
					},
				},
			},
			async handler(data, context) {
				let enabled = data.recording
				if (enabled == "toggle") {
					await this.obs.call("ToggleRecord")
				} else {
					if (enabled) {
						await this.obs.call("StartRecord")
					} else {
						await this.obs.call("StopRecord")
					}
				}
			},
		},
		virtualCamStartStop: {
			name: "Virtual Camera Start/Stop",
			description: "Start or Stop the Virtual Camera",
			icon: "mdi-webcam",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					virtualCam: {
						type: "Toggle",
						name: "Virtual Camera",
						required: true,
						default: true,
						trueIcon: "mdi-camera",
						falseIcon: "mdi-camera-off",
					},
				},
			},
			async handler(data, context) {
				let enabled = data.virtualCam
				if (enabled == "toggle") {
					await this.obs.call("ToggleVirtualCam")
				} else {
					if (enabled) {
						await this.obs.call("StartVirtualCam")
					} else {
						await this.obs.call("StopVirtualCam")
					}
				}
			},
		},
		replayBufferStartStop: {
			name: "Replay Buffer Start/Stop",
			description: "Start or Stop the Replay Buffer",
			icon: "mdi-replay",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {
					virtualCam: {
						type: "Toggle",
						name: "Virtual Camera",
						required: true,
						default: true,
						trueIcon: "mdi-camera",
						falseIcon: "mdi-camera-off",
					},
				},
			},
			async handler(data, context) {
				let enabled = data.virtualCam
				if (enabled == "toggle") {
					await this.obs.call("ToggleReplayBuffer")
				} else {
					if (enabled) {
						await this.obs.call("StartReplayBuffer")
					} else {
						await this.obs.call("StopReplayBuffer")
					}
				}
			},
		},
		replaySave: {
			name: "Save Replay Buffer",
			description: "Saves the replay buffer.",
			icon: "mdi-content-save",
			color: "#607A7F",
			data: {
				type: Object,
				properties: {},
			},
			async handler(data, context) {
				await this.obs.call("SaveReplayBuffer")
			},
		},
	},
}
