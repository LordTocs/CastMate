import { createReactiveProperty, deleteReactiveProperty } from "../utils/reactive.js"
import { evalTemplate, template } from '../utils/template.js'
import { variablesFilePath } from '../utils/configuration.js'

import { HotReloader } from '../utils/hot-reloader.js'

export default {
	name: "variables",
	uiName: "Variables",
	icon: "mdi-variable",
	color: "#D3934A",
	async init() {
		this.variableSpecs = {};
		this.logger.info(`Watching ${variablesFilePath}`);
		this.variableSettingsReloader = new HotReloader(variablesFilePath,
			() => {
				this.loadVariables();
			},
			() => {
				this.logger.error('Oh no there was a variable file error.')
			});

		this.loadVariables();

	},
	ipcMethods: {
		setVariableValue(name, value) {
			if (!(name in this.state))
				return;

			this.state[name] = value;
		}
	},
	methods: {
		loadVariables() {
			const variableData = this.variableSettingsReloader.data;

			this.logger.info("Reloading Variables...");
			let needsDependencyUpdate = false;

			for (let variableName in variableData) {
				let variableSpec = variableData[variableName];
				let defaultValue = variableSpec.default;

				if (defaultValue == undefined) {
					if (variableSpec.type && variableSpec.type == "string") {
						defaultValue = "";
					}
					else {
						defaultValue = 0;
					}
				}
				if (variableSpec.type == "Number") {
					defaultValue = Number(defaultValue);
				}

				if (variableName in this.variableSpecs) {
					//Already have this variable.
					if (this.variableSpecs[variableName].type != variableSpec.type) {
						//We need to update the type and thus the default value.
						this.logger.info(`Variable ${variableName} type has changed, resetting to default.`)
						this.variableSpecs[variableName].type = variableSpec.type;
						this.state[variableName] = defaultValue;
					}
				}
				else {
					//This is a new variable.
					this.logger.info(`New Variable ${variableName}`);
					this.variableSpecs[variableName] = variableSpec;
					this.createVariable(variableName, defaultValue);
					needsDependencyUpdate = true;
				}
			}

			for (let variableName in this.variableSpecs) {
				if (!(variableName in variableData)) {
					//This variable is gone, destroy it.
					this.logger.info(`Deleting Variable ${variableName}`);
					deleteReactiveProperty(this.state, variableName);
					this.plugins.removeReactiveValue(this.name, variableName);
					needsDependencyUpdate = true;
					delete this.variableSpecs[variableName];
				}
			}

			if (needsDependencyUpdate) {
				this.profiles.redoDependencies();
			}
		},
		createVariable(name, value) {
			this.state[name] = value
			createReactiveProperty(this.state, name);
			this.plugins.updateReactivity(this);
		},
		async handleTemplateNumber(value, context) {
			if (typeof value === 'string' || value instanceof String) {
				return Number(await evalTemplate(value, context))
			}
			return value;
		}
	},
	settings: {
	},
	secrets: {
	},
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
						}
					},
					value: { type: Number, template: true, name: "Set Value" },
				}
			},
			async handler(variableData, context) {
				if (!variableData.name)
					return;

				if (!(variableData.name in this.state))
					return;

				//Set the value
				let setValue = variableData.value;
				if (typeof this.state[variableData.name] == 'number' || this.state[variableData.name] instanceof Number) {
					setValue = await this.handleTemplateNumber(setValue, context);
				} else {
					setValue = await template(setValue, context);
				}
				this.logger.info(`Setting ${variableData.name} to ${setValue}`);
				this.state[variableData.name] = setValue;
			}
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
							return Object.keys(this.state)
						}
					},
					offset: { type: Number, template: true, name: "Offset Value" },
				}
			},
			async handler(variableData, context) {
				if (!variableData.name)
					return;

				if (!(variableData.name in this.state))
					return;

				//Add the value
				this.state[variableData.name] += variableData.offset;
				this.logger.info(`Offseting ${variableData.name} by ${variableData.offset}`);
			}
		}
	}
}