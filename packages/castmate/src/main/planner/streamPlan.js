import { ActionQueue } from "../actions/action-queue";
import { PluginManager } from "../pluginCore/plugin-manager";
import { FileResource, Resource } from "../resources/resource";
import { callIpcFunc, ipcFunc } from "../utils/electronBridge";
import logger from "../utils/logger";





export class StreamPlan extends FileResource {

    static storageFolder = "streamplans/"


    async start() {
        if (this.config.startAutomation)
            ActionQueue.getInstance().startAutomation(this.config.startAutomation, {})
        return true
    }

    async startSegment(id) {
        const segment = this.config.segments.find(s => s.id == id)
        if (!segment) {
            logger.error(`Tried to start segment ${id} on plan without it`)
            return false
        }
        
        const plugins = PluginManager.getInstance()

        const twitch = plugins.getPlugin("twitch")
        
        if (segment.streamInfo) {
            await twitch.ipcMethods.updateStreamInfo(segment.streamInfo)
        }

        if (segment.startAutomation) {
            ActionQueue.getInstance().startAutomation(segment.startAutomation, {})
        }

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

        if (!plan) {
            logger.error(`Invalid Plan ID ${id}`)
            return false
        }

        if (!await plan.start())
        {
            logger.error(`Failed to start plan ${id}`)
            return false
        }

        this.currentPlan = plan

        callIpcFunc("streamplan_setCurrentPlan", id)

        if (plan.config.segments?.length > 0) {
            await this.startSegment(plan.config.segments[0].id)
        }
    }

    async endPlan() {
        if (this.currentPlan) {
            await this.currentPlan.end();
        }

        callIpcFunc("streamplan_setCurrentPlan", null)
        callIpcFunc("streamplan_setCurrentSegment", null)

        this.currentPlan = null
        this.currentSegment = null
    }

    async startSegment(id) {
        logger.info(`Starting Segment: ${id}`);

        if (!this.currentPlan)
            return false
        
        if (!await this.currentPlan.startSegment(id)) {
            return false
        }

        this.currentSegment = id

        callIpcFunc("streamplan_setCurrentSegment", id)
    }

    async nextSegment() {
        if (!this.currentPlan)
            return false
        
        const currentSegmentIdx = this.currentPlan.config.segments.findIndex(s => s.id == this.currentSegment)
        if (currentSegmentIdx == -1)
            return false //We could get here if someone deletes the active segment in the editor!

        if (this.currentPlan.config.segments.length <= currentSegmentIdx + 1) {
            return false;
        }

        const nextSegmentId = this.currentPlan.config.segments[currentSegmentIdx + 1].id;

        logger.info(`Moving to Next Segment`);

        await this.startSegment(nextSegmentId);
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

        ipcFunc("streamplan", "getCurrentPlan", () => this.currentPlan?.id)
        ipcFunc("streamplan", "getCurrentSegment", () => this.currentSegment)

        ipcFunc("streamplan", "startPlan", async (id) => {
            await this.startPlan(id)
        })

        ipcFunc("streamplan", "endPlan", async () => {
            await this.endPlan();
        })

        ipcFunc("streamplan", "startSegment", async (id) => {
            await this.startSegment(id)
        })

        ipcFunc("streamplan", "nextSegment", async () => {
            await this.nextSegment();
        })
    }


}