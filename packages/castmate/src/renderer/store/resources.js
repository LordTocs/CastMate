import { ipcRenderer } from "electron";

// TECH DEBT - TECH DEBT - TECH DEBT - TECH DEBT
// We should be switching to pinia but right now we're still on vuex.
// SO NOW WE GOTTA UPDATE THIS WHOLE FILE LATER.

export default {
    namespaced: true,
    state() {
        return {
            resourceTypes: [],
            resources: {}
        }
    },
    getters: {
        resourceTypes: state => state.resourceTypes,
        resources: state => state.resources
    },
    mutations: {
        setResourceTypes(state, resourceTypes) {
            state.resourceTypes = resourceTypes
        },
        setResourceArray(state, {type, resources }) {
            state.resources[type] = resources
        }
    },
    actions: {
        async initResources({ commit }) {
            const resourceTypes = await ipcRenderer.invoke(`resourceManager_getResourceTypes`)
            console.log("Getting Resource Types", resourceTypes)

            commit('setResourceTypes', resourceTypes);

            //Initial array state load

            const resourceArrays = await Promise.all(resourceTypes.map( async rt => ({
                type: rt.type,
                resources: await ipcRenderer.invoke(`resources_${rt.type}_get`)
            })));


            for (let rArray of resourceArrays) {
                commit('setResourceArray', rArray)
            }
        },

        async updateResourceArray({ commit }, { type, resources}) {
            commit('setResourceArray', { type, resources });
        }
    }
}