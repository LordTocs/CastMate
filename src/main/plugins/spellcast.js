
import { WebSocket } from 'ws'
import { onStateChange } from '../utils/reactive'
import axios from "axios"
import { RPCWebSocket } from '../utils/rpc-websocket.js'

const iconSvg = "m 2.0080331,8.616092 c -4.2268094,6.315379 8.0772869,12.422668 8.3448569,12.423225 0.213948,3.62e-4 6.594607,-1.869405 5.573124,-4.027231 C 14.36785,13.720556 5.7176479,9.5778192 8.2086563,8.12845 9.3809946,7.4278447 15.357308,10.53877 16.305331,13.743698 17.970784,5.7313764 5.2620829,5.5062332 12.846312,0.95047028 -6.5179222,6.5085832 9.1201791,11.967068 7.6962099,13.160986 6.2722364,14.354901 0.51904627,12.846902 2.0080331,8.616092 Z"

export default {
    name: "spellcast",
    uiName: "SpellCast",
    icon: `svg:${iconSvg}`,
    color: "#488EE2",
    async init() {
        this.twitch = this.plugins.getPlugin("twitch");

        this.accessWatcher = onStateChange(this.twitch.state, "accessToken", async () => {
            await this.disconnect();
            await this.connect();
        });

        try {
            await this.connect();
        }
        catch (err) {
            this.logger.error("Error connecting to SpellCast");
        }
    },
    ipcMethods: {
        getSpellHooks() {
            return this.spellHooks || [];
        },
        getSpellHook(hookId) {
            return this.spellHooks.find(h => h._id == hookId);
        },
        async createSpellHook(hookData) {
            const channelId = this.twitch.state.channelId;

            try {
                this.logger.info(`Creating SpellHook ${hookData.name} ${hookData.description}`);
                const newHook = await this.apiClient.post(`/streams/${channelId}/hooks/`, hookData);
                this.logger.info(`Created SpellHook ${newHook.data._id}`);

                this.spellHooks.push(newHook.data);
                return newHook.data;

            }
            catch (err) {
                this.logger.error(`Error Creating Hook, ${err}`);
                return null;
            }
        },
        async updateSpellHook(hookId, hookData) {
            const channelId = this.twitch.state.channelId;

            try {
                const newHook = await this.apiClient.put(`/streams/${channelId}/hooks/${hookId}`, hookData);
                const idx = this.spellHooks.findIndex(h => h._id == hookId);
                this.spellHooks[idx] = newHook.data;
                return newHook.data
            }
            catch (err) {
                this.logger.error(`Error Updating Hook, ${err}`);
            }
        },
        async deleteSpellHook(hookId) {
            const channelId = this.twitch.state.channelId;

            if (!accessToken) {
                this.logger.info(`Can't connect to SpellCast, no twitch sign on.`);
                return;
            }

            try {
                await this.apiClient.delete(`/streams/${channelId}/hooks/${hookId}`)
                const idx = this.spellHooks.findIndex(h => h._id == hookId);
                this.spellHooks.splice(idx, 1);
            }
            catch (err) {
                this.logger.error(`Error Updating Hook, ${err}`);
            }
        }
    },
    methods: {
        async retry() {
            await this.disconnect();

            //Retry connection in 5 seconds.
            if (this.reconnect) {
                this.logger.info(`Connection to spellcast websocket (${import.meta.env.VITE_SPELLCAST_SOCKET_URL}) failed, retrying in 5 seconds...`);
                setTimeout(() => {
                    this.connect().catch(err => {
                        this.logger.error(`Exception on socket reconnect.`);
                        this.logger.error(`${err}`);
                        this.retry();
                    })
                }, 5000);
            }
        },
        async disconnect() {
            if (this.websocket) {
                this.websocket.terminate();

                if (this.websocketPinger) {
                    clearInterval(this.websocketPinger);
                    this.websocketPinger = null;
                }
            }

            this.websocket = null;
            this.requestSocket = null;
        },
        async connect() {
            //TODO: Fix public methods accessor.
            const accessToken = this.twitch.state.accessToken;

            if (!accessToken) {
                this.logger.info(`Can't connect to SpellCast, no twitch sign on.`);
                this.apiClient = null;
                return;
            }

            this.apiClient = axios.create({
                baseURL: import.meta.env.VITE_SPELLCAST_URL
            })

            this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            await this.initHookData();

            this.reconnect = true;

            this.websocket = new WebSocket(import.meta.env.VITE_SPELLCAST_SOCKET_URL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });

            this.websocket.on('open', () => {
                this.logger.info(`Connection to SpellCast open (${import.meta.env.VITE_SPELLCAST_SOCKET_URL})`);

                this.requestSocket = new RPCWebSocket(this.websocket);

                this.requestSocket.handle("getHooks", () => this.getActiveHooks());
                this.requestSocket.handle("runHook", (hookId, context) => {
                    return this.triggers.spellHook({ hookId, ...context, userColor: this.twitch.publicMethods.getUserColor(context.userId) })
                });

                this.requestSocket.call("setActiveHooks", Array.from(this.activeHooks));

                //Every 30 seconds ping to keep the socket alive.
                this.websocketPinger = setInterval(() => {
                    if (this.websocket.readyState == 1) {
                        this.websocket.ping()
                    }
                }, 30000);
            })

            this.websocket.on('close', () => {
                this.retry();
            });

            this.websocket.on('unexpected-response', (request, response) => {
                this.logger.error(`Unexpected Response!`);
                console.log(response);
                this.retry();
            });

            this.websocket.on('error', (err) => {
                //Empty function to prevent unhandled exceptions rippling up somewhere else in the process.
            });



        },
        async initHookData() {
            await this.loadSpellHooks();
        },
        async loadSpellHooks() {
            const channelId = this.twitch.state.channelId;

            try {
                const resp = await this.apiClient.get(`/streams/${channelId}/hooks/`);

                this.logger.info(`Loaded Button Hooks (${resp.data.length})`);
                this.spellHooks = resp.data;
            }
            catch (err) {
                this.logger.error(`Error loading button hooks ${err}`);
            }
        },
        async getActiveHooks() {
            return Array.from(this.activeHooks);
        }
    },
    triggers: {
        spellHook: {
            name: "Spell Cast",
            description: "Fires when a viewer casts a spell with bits",
            config: {
                type: Object,
                properties: {
                    hookId: { type: "SpellcastHook", name: "Spell Hook" },
                }
            },
            context: {
                hookId: { type: String },
                user: { type: String },
                userId: { type: String },
                userColor: { type: String },
            },
            handler(config, context) {
                return config.hookId == context.hookId;
            }
        },
    },
    async onProfileLoad(profile, config) {
        const buttonTriggers = config?.triggers?.spellcast?.spellHook;

        profile.spellHooks = buttonTriggers ? buttonTriggers.map(rt => rt.config.hookId) : [];
    },
    async onProfilesChanged(activeProfiles, inactiveProfiles) {
        this.activeHooks = new Set();

        //Handle rewards
        for (let activeProf of activeProfiles) {
            for (let hookId of activeProf.spellHooks) {
                this.activeHooks.add(hookId);
            }
        }

        if (this.requestSocket) {
            this.requestSocket.call("setActiveHooks", Array.from(this.activeHooks));
        }
    },
    state: {
        connected: {
            type: Boolean,
            name: "Connected To Spellcast",
            hidden: true,
        }
    }
}