import { ipcRenderer } from "electron";

// TECH DEBT - TECH DEBT - TECH DEBT - TECH DEBT
// We should be switching to pinia but right now we're still on vuex.
// SO NOW WE GOTTA UPDATE THIS WHOLE FILE LATER.

export default {
    namespaced: true,
    state() {
        return {
            templateData: {},
        }
    },
    getters: {
        templateData: state => state.templateData,
    },
    mutations: {
        createTemplateData(state, { id }) {
            state.templateData[id] = {}
        },
        setTemplateData(state, {id, data}) {
            if (id in state.templateData)
            {
                state.templateData[id] = data
            }
        },
        clearTemplateData(state, { id }) {
            delete state.templateData[id]
        }
    },
    actions: {
        /*async updateResourceArray({ commit }, { type, resources}) {
            commit('setResourceArray', { type, resources });
        }*/
    }
}