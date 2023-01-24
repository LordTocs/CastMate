import { callIpcFunc, ipcFunc } from "../utils/electronBridge";
import logger from "../utils/logger";
import _merge from "lodash/merge"
import _cloneDeep from "lodash/cloneDeep"
import { deleteReactiveProperty, onStateChange, reactiveCopy, reactiveCopyProp } from "./reactive";
import { PluginManager } from "../pluginCore/plugin-manager";

let stateManager = null;
/**
 * Responsible for communicating state with UI and later serializing it to disk
 */
export class StateManager 
{
    constructor() {
        this.rootState = {};
        this.stateWatchers = {};

        ipcFunc('state', 'getRootState', () => {
            return _cloneDeep(this.rootState)
        })
    }

    /**
     * 
     * @returns {StateManager}
     */
    static getInstance() {
        if (!stateManager)
        {
            stateManager = new StateManager();
        }
        return stateManager;
    }

    createStateWatcher(pluginName, prop) {
        if (this.stateWatchers[pluginName][prop])
        {
            logger.error(`Redundant state watcher ${pluginName}${prop}`)
            return
        }

        this.stateWatchers[pluginName][prop] = onStateChange(this.rootState[pluginName], prop, () => {
            callIpcFunc('state-update', {
                [pluginName]: {
                    [prop]: this.rootState[pluginName][prop]
                }
            })
        })
    }

    registerPlugin(plugin) {
        if (plugin.name in this.rootState)
        {
            logger.error(`Double Registered Plugin ${plugin.name}`)   
        }

        this.rootState[plugin.name] = {}
        this.stateWatchers[plugin.name] = {}

        //Copy our props to the new object while sharing reactivity info.
        reactiveCopy(this.rootState[plugin.name], plugin.pluginObj.state)

        for (let prop in this.rootState[plugin.name])
        {
            this.createStateWatcher(plugin.name, prop)
        }
    }

    addPluginReactiveProp(pluginObj, prop) {
        let pluginState = this.rootState[pluginObj.name]
        if (!pluginState) {
			pluginState = this.rootState[pluginObj.name] = {};
		}

        reactiveCopyProp(pluginState, pluginObj.state, prop);

        this.createStateWatcher(pluginObj.name, prop)
    }

    removePluginReactiveProp(pluginObj, prop) {
        let pluginState = this.rootState[pluginObj.name]
        if (!pluginState) {
			pluginState = this.rootState[pluginObj.name] = {};
		}

        this.stateWatchers[pluginObj.name][prop].unsubscribe();

        deleteReactiveProperty(pluginState, prop)

        delete this.stateWatchers[pluginObj.name][prop]

        callIpcFunc('state-removal', { [pluginObj.name]: prop})
    }

    getTemplateContext(localContext) {
        let completeContext = { ...localContext };
		
        _merge(completeContext, PluginManager.getInstance().templateFunctions);
		
        //merge won't work with reactive props, manually go deep here.
		for (let pluginKey in this.rootState) {
			if (!(pluginKey in completeContext)) {
				completeContext[pluginKey] = {};
			}
			reactiveCopy(completeContext[pluginKey], this.rootState[pluginKey]);
		}
		return completeContext;
    }
}