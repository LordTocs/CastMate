import { callIpcFunc, ipcFunc } from "../utils/electronBridge"
import logger from "../utils/logger"
import _merge from "lodash/merge"
import _cloneDeep from "lodash/cloneDeep"
import {
	deleteReactiveProperty,
	onStateChange,
	reactiveCopy,
	reactiveCopyProp,
} from "./reactive"
import { PluginManager } from "../pluginCore/plugin-manager"
import { stateFilePath, userFolder } from "../utils/configuration"
import fs from "fs"
import YAML from "yaml"
import path from "path"

let stateManager = null
/**
 * Responsible for communicating state with UI and later serializing it to disk
 */
export class StateManager {
	constructor() {
		this.rootState = {}
		this.stateWatchers = {}

		this.pendingSerialize = null

		this.serializers = []

		this.initialState = null

		this.loading = true

		ipcFunc("state", "getRootState", () => {
			return _cloneDeep(this.rootState)
		})
	}

	/**
	 *
	 * @returns {StateManager}
	 */
	static getInstance() {
		if (!stateManager) {
			stateManager = new StateManager()
		}
		return stateManager
	}

	createStateWatcher(pluginName, prop, schema) {
		if (this.stateWatchers[pluginName][prop]) {
			logger.error(`Redundant state watcher ${pluginName}${prop}`)
			return
		}

		if (schema?.serialized) {
			this.serializers.push({
				pluginName,
				prop,
			})

			if (this.initialState) {
				this.rootState[pluginName][prop] =
					this.initialState[pluginName]?.[prop] ??
					this.rootState[pluginName][prop]
			}
		}

		this.stateWatchers[pluginName][prop] = onStateChange(
			this.rootState[pluginName],
			prop,
			() => {
				callIpcFunc("state_update", {
					[pluginName]: {
						[prop]: this.rootState[pluginName][prop],
					},
				})

				if (schema?.serialized) {
					this.scheduleSerialize()
				}
			},
			{ immediate: true }
		)
	}

	scheduleSerialize() {
		if (!this.pendingSerialize && !this.loading) {
			this.pendingSerialize = setTimeout(() => {
				this.serialize()
				this.pendingSerialize = null
			}, 100)
		}
	}

	async serialize() {
		const result = {}

		console.log("Serializing State ", this.serializers.length)
		for (let serializer of this.serializers) {
			if (!(serializer.pluginName in result)) {
				result[serializer.pluginName] = {}
			}

			result[serializer.pluginName][serializer.prop] =
				this.rootState[serializer.pluginName][serializer.prop]
		}

		await fs.promises.writeFile(
			stateFilePath,
			YAML.stringify(result),
			"utf-8"
		)
	}

	async loadSerialized() {
		try {
			this.initialState = YAML.parse(
				await fs.promises.readFile(stateFilePath, "utf-8")
			)
			this.loading = false
		} catch (err) {
			logger.error(`Error Loading Initial Plugin State`)
		}
	}

	finishLoad() {
		this.initialState = null
	}

	registerPlugin(plugin) {
		if (plugin.name in this.rootState) {
			logger.error(`Double Registered Plugin ${plugin.name}`)
		}

		this.rootState[plugin.name] = {}
		this.stateWatchers[plugin.name] = {}

		//Copy our props to the new object while sharing reactivity info.
		reactiveCopy(this.rootState[plugin.name], plugin.pluginObj.state)

		for (let prop in this.rootState[plugin.name]) {
			this.createStateWatcher(
				plugin.name,
				prop,
				plugin.stateSchemas[prop]
			)
		}
	}

	addPluginReactiveProp(pluginObj, prop, schema) {
		let pluginState = this.rootState[pluginObj.name]
		if (!pluginState) {
			pluginState = this.rootState[pluginObj.name] = {}
		}

		reactiveCopyProp(pluginState, pluginObj.state, prop)

		this.createStateWatcher(pluginObj.name, prop, schema)
	}

	removePluginReactiveProp(pluginObj, prop) {
		let pluginState = this.rootState[pluginObj.name]
		if (!pluginState) {
			pluginState = this.rootState[pluginObj.name] = {}
		}

		this.stateWatchers[pluginObj.name][prop].unsubscribe()

		deleteReactiveProperty(pluginState, prop)

		const idx = this.serializers.findIndex(
			(s) => s.pluginName == pluginObj.name && s.prop == prop
		)
		if (idx >= 0) {
			this.serializers.splice(idx, 1)
		}

		delete this.stateWatchers[pluginObj.name][prop]

		callIpcFunc("state_removal", { [pluginObj.name]: prop })
	}

	getTemplateContext(localContext) {
		let completeContext = { ...localContext }

		_merge(completeContext, PluginManager.getInstance().templateFunctions)

		//merge won't work with reactive props, manually go deep here.
		for (let pluginKey in this.rootState) {
			if (!(pluginKey in completeContext)) {
				completeContext[pluginKey] = {}
			}
			reactiveCopy(completeContext[pluginKey], this.rootState[pluginKey])
		}
		return completeContext
	}
}
