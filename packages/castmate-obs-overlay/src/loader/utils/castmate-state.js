
export class StateProvider {
    constructor() {
        this.stateSubscriptions = {}
    }

    init(rootState, bridge) {
        console.log("Inited State Provider")
        this.rootState = rootState
        this.bridge = bridge
        

        bridge.on('stateUpdate', (pluginName, stateName, value) => {
            if (!(pluginName in this.rootState))
            {
                this.rootState[pluginName] = {}
            }
            this.rootState[pluginName][stateName] = value;
        })

        bridge.on('connected', async () => {
            //We've just connected for the first time, so recreate all our state acquisitions
            const promises = [];

            for (let pluginName in this.stateSubscriptions) {
                for (let stateName in this.stateSubscriptions[pluginName]) {
                    promises.push(async () => {
                        const value = await this.bridge.acquireState(pluginName, stateName)
                        this.rootState[pluginName][stateName] = value
                    })
                }
            }

            await Promise.all(promises)
        })
    }

    acquireState(pluginName, stateName) {
        console.log("Acquiring", pluginName, stateName)
        if (!(pluginName in this.stateSubscriptions))
        {
            this.stateSubscriptions[pluginName] = {}
            this.rootState[pluginName] = {}
        }

        if (!(stateName in this.stateSubscriptions[pluginName]))
        {
            console.log("New Acquire")
            this.stateSubscriptions[pluginName][stateName] = 0
            //Tell CastMate to start sending this state
            this.rootState[pluginName][stateName] = null
            
            this.bridge.acquireState(pluginName, stateName).then((initialValue) => this.rootState[pluginName][stateName] = initialValue)
        }

        this.stateSubscriptions[pluginName][stateName]++
        
        return this.rootState[pluginName][stateName]
    }
    freeState(pluginName, stateName) {
        if (this.stateSubscriptions[pluginName]?.[stateName])
        {
            const remaining = --this.stateSubscriptions[pluginName][stateName]

            if (remaining == 0) {
                //Tell CastMate to stop sending this state.
                this.bridge.freeState(pluginName, stateName)
                delete this.stateSubscriptions[pluginName][stateName]
            }
        }
    }
}
