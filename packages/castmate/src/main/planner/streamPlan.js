import { ActionQueue } from "../actions/action-queue";
import { PluginManager } from "../pluginCore/plugin-manager";
import { FileResource, Resource } from "../resources/resource";
import { callIpcFunc } from "../utils/electronBridge";





export class StreamPlan extends FileResource {

    static storageFolder = "streamplans/"


    async start() {
        if (this.config.startAutomation)
            ActionQueue.getInstance().startAutomation(this.config.startAutomation, {})
        return true
    }

    async startSegment(id) {
        const segment = this.config.segments.find(s => s.id == id)
        if (segment)
            return false
        
        const plugins = PluginManager.getInstance()

        const twitch = plugins.getPlugin("twitch")
        
        if (segment.streamInfo) {
            await twitch.ipcMethods.updateInfo(segment.streamInfo)
        }

        if (segment.startAutomation)
            ActionQueue.getInstance().startAutomation(segment.startAutomation, {})

        return true
    }

    async end() {
        if (this.config.endAutomation)
            ActionQueue.getInstance().startAutomation(this.config.endAutomation, {})

        return true
    }
}

let streamPlanManager = null;
export class StreamPlanManager {

    /**
     * 
     * @returns {StreamPlanManager}
     */
     static getInstance() {
        if (!streamPlanManager)
        {
            streamPlanManager = new this();
        }
        return streamPlanManager;
    }

    async startPlan(id) {
        const plan = this.planResources.getById(id)

        if (!plan)
            return false

        if (!await plan.start())
            return false

        callIpcFunc("streamplan_setCurrentPlan", id)
    }

    async startSegment(id) {
        if (!this.currentPlan)
            return false
        
        if (!await this.currentPlan.startSegment(id))
            return false

        this.currentSegment = id
        callIpcFunc("streamplans_setCurrentSegment", id)
    }

    constructor() {
        this.currentPlan = null;
        this.currentSegment = null;

        this.planResources = new Resource(StreamPlan, {
            type: "streamplan",
            name: "Stream Plan",
            description: "Stream Plan",
            config: {
                type: Object,
                properties: {
                    name: { type: String },
                    //HERE IS WHERE ID PUT THE GO LIVE. IF I HAD ONE!
                    startAutomation: { type: Object },
                    endAutomation: { type: Object },
                    //segments: { type: Array }
                }
            }
        })
    }

    async init() {
        await this.planResources.load();
    }


}