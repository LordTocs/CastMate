import {
	createReactiveProperty,
	deleteReactiveProperty,
} from "../state/reactive.js"
import { evalTemplate, template, templateNumber } from "../state/template.js"
import { variablesFilePath } from "../utils/configuration.js"

import { HotReloader } from "../utils/hot-reloader.js"
import { StateManager } from "../state/state-manager.js"
import fs from "fs"
import YAML from "yaml"
import { callIpcFunc } from "../utils/electronBridge.js"

export default {
	name: "variables",
	uiName: "Variables",
	icon: "mdi-variable",
	color: "#D3934A",
	async init() {
		this.variableSpecs = {}

		this.logger.info("Loading Variables")
		await this.load()
	},
	ipcMethods: {
		getVariableSpecs() {
			return this.variableSpecs
		},
		addVariable(name, spec) {
			if (name in this.variableSpecs) {
				return false
			}

			this.createVariable(name, spec)
			this.saveSpecs()
			return true
		},
		getDefaultValue(spec) {
			let defaultValue = spec.default
			if (defaultValue == undefined) {
				//Woops should have been more strict about casing in types!
				if (
					spec.type &&
					(spec.type == "string" || spec.type == "String")
				) {
					defaultValue = ""
				} else {
					defaultValue = 0
				}
			}
			return defaultValue
		},
		changeVariableName(oldName, newName) {},
		updateVariableSpec(name, spec) {
			const currentSpec = this.variableSpecs[name]

			if (!currentSpec) return false

			//Save the current value
			const currentValue = this.state[name]
			//Delete the prop and anything the statemanager has for it.
			deleteReactiveProperty(this.state, name)
			StateManager.getInstance().removePluginReactiveProp(this, name)

			//Recreate the prop
			this.variableSpecs[name] = spec

			if (currentSpec.type != spec.type) {
				this.state[name] = this.getDefaultValue(spec)
			} else {
				//Restore the currentValue if we can
				this.state[name] = currentValue
			}

			createReactiveProperty(this.state, name)
			StateManager.getInstance().addPluginReactiveProp(this, name, spec)
			this.profiles.redoDependencies()
			this.saveSpecs()

			return true
		},
		removeVariable(name) {
			if (!(name in this.variableSpecs)) {
				return false
			}

			deleteReactiveProperty(this.state, name)
			StateManager.getInstance().removePluginReactiveProp(this, name)
			delete this.variableSpecs[name]
			this.profiles.redoDependencies()
			this.saveSpecs()
			return true
		},
		resetVariable(name) {
			if (!(name in this.state)) return

			this.state[name] = this.getDefaultValue(this.variableSpecs[name])
		},
		setVariableValue(name, value) {
			if (!(name in this.state)) return

			this.state[name] = value
		},
	},
	methods: {
		async load() {
			const variableData = YAML.parse(
				await fs.promises.readFile(variablesFilePath, "utf-8")
			)

			for (let variableName in variableData) {
				const variableSpec = variableData[variableName]
				this.logger.info(
					`Created Variable ${variableName}:${variableSpec.type} -> ${variableSpec.default}`
				)
				this.createVariable(variableName, variableSpec)
			}
		},
		async saveSpecs() {
			try {
				await fs.promises.writeFile(
					variablesFilePath,
					YAML.stringify(this.variableSpecs),
					"utf-8"
				)
				callIpcFunc("variables_updateSpecs", this.variableSpecs)
			} catch (err) {
				this.logger.error(`Failed writing to ${variablesFilePath}`)
			}
		},
		createVariable(name, spec) {
			this.variableSpecs[name] = spec
			this.state[name] = this.getDefaultValue(spec)
			createReactiveProperty(this.state, name)

			StateManager.getInstance().addPluginReactiveProp(this, name, spec)
		},
	},
	settings: {},
	secrets: {},
	actions: {
		set: {
			name: "Set Variable",
			icon: "mdi-variable",
			color: "#D3934A",
			data: {
				type: Object,
				properties: {
					name: {
						type: String,
						name: "Variable Name",
						async enum() {
							return Object.keys(this.state)
						},
					},
					value: { type: Number, template: true, name: "Set Value" },
				},
			},
			async handler(variableData, context) {
				if (!variableData.name) return

				if (!(variableData.name in this.state)) return

				const spec = this.variableSpecs[variableData.name]
				if (!spec) return

				const isString = spec.type == "string" || spec.type == "String"
				const isNumber = spec.type == "Number"

				//Set the value
				if (isNumber) {
					const setValue = Number(
						await templateNumber(variableData.value, context)
					)
					if (!isNaN(setValue)) {
						this.state[variableData.name] = setValue
						this.logger.info(`Setting ${variableData.name} to ${setValue}`)
					}
				} else if (isString) {
					const setValue = await template(
						setValue,
						context
					)
					this.state[variableData.name] = setValue
					this.logger.info(`Setting ${variableData.name} to ${setValue}`)
				}

				
			},
		},
		inc: {
			name: "Increment Variable",
			icon: "mdi-variable",
			color: "#D3934A",
			data: {
				type: Object,
				properties: {
					name: {
						type: String,
						name: "Variable Name",
						async enum() {
							return Object.keys(this.variableSpecs).filter(
								(name) =>
									this.variableSpecs[name].type == "Number"
							)
						},
					},
					offset: {
						type: Number,
						template: true,
						name: "Offset Value",
					},
				},
			},
			async handler(variableData, context) {
				if (!variableData.name) return

				if (!(variableData.name in this.state)) return

				const spec = this.variableSpecs[variableData.name]
				if (!spec) return

				const isNumber = spec.type == "Number"

				if (!isNumber) {
					return
				}

				//Add the value
				const offset = Number(
					await templateNumber(variableData.offset, context)
				)
				
				if (!isNaN(offset)) {
					this.state[variableData.name] = Number(
						this.state[variableData.name] + offset
					)
					this.logger.info(`Offseting ${variableData.name} by ${offset}`)
				}
			},
		},
	},
}
