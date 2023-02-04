import { onMounted, onUnmounted } from 'vue'

export function mapCastMateState(plugin, states) {
    const result = {}

    for (let stateName of states) {
        let oneTime = false;
        result[stateName] = function() {
            
            console.log("Before Acquire")
            if (this.stateProvider && !oneTime) {
                oneTime = true;
                console.log("Acquiring")
                this.stateProvider.acquireState(plugin, stateName)
            }

            return this.stateProvider?.rootState[plugin]?.[stateName]
        }
    }

    return result
}