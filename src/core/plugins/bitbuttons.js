const fs = require('fs');
const path = require('path');
const { userFolder } = require('../utils/configuration');
const nanoid = require('nanoid');
const { WebSocket } = require('ws');
const { onStateChange } = require('../utils/reactive');
const HotReloader = require('../utils/hot-reloader');
const { buttonsFilePath } = require("../utils/configuration");
const { default: axios } = require('axios');

class RequestSocket {
    constructor(socket) {
        this.socket = socket;

        this.outstandingCalls = {};
        this.handlers = {};
        this.idGen = nanoid.customAlphabet("abcdefghijklmnop0123456789", 10);

        this.socket.on('message', async (textData) => {
            let data = null;
            try {
                data = JSON.parse(textData);
            }
            catch
            {
                return;
            }

            if ("responseId" in data) {
                const outstandingCall = this.outstandingCalls[data.responseId];
                if (!outstandingCall) {
                    //error!
                    return;
                }
                try {
                    if (data.failed) {
                        outstandingCall.reject();
                    }
                    else {
                        outstandingCall.resolve(data.result);
                    }
                }
                catch
                {
                    outstandingCall.reject();
                }
                finally {
                    delete outstandingCall[data.responseId];
                }
            }
            else if ("requestId" in data) {
                const requestName = data.name;
                const requestId = data.requestId;
                if (!requestName) {
                    return;
                }
                const args = data.args || [];

                this.handlers[requestName](requestId, ...args);
            }
        })
    }

    handle(name, func) {
        this.handlers[name] = async (requestId, ...args) => {
            let result;
            try {
                result = await func(...args);
            }
            catch (err) {
                await this.socket.send(JSON.stringify({
                    responseId: requestId,
                    failed: true
                }))
                return;
            }
            await this.socket.send(JSON.stringify({
                responseId: requestId,
                result
            }))
        }
    }

    call(name, ...args) {
        const promise = new Promise(async (resolve, reject) => {
            const data = {
                name,
                requestId: this.idGen(),
                args: [...args]
            }

            this.outstandingCalls[data.requestId] = { resolve, reject };

            await this.socket.send(JSON.stringify(data));
        })
        return promise;
    }
}


module.exports = {
    name: "bitbuttons",
    uiName: "BitButtons",
    icon: "$vuetify.icons.bitbuttons",
    color: "#8DC0C1",
    async init() {
        this.twitch = this.plugins.getPlugin("twitch");

        onStateChange(this.twitch.state, "accessToken", async () => {
            await this.disconnect();
            await this.connect();
        });

        try {
            await this.connect();
        }
        catch (err) {
            this.logger.error("Error connecting to BitButtons");
        }
    },
    ipcMethods: {
        getButtonHooks() {
            return this.buttonHooks || [];
        },
        async createButtonHook(hookData) {
            const channelId = this.twitch.publicMethods.getChannelId();
            const accessToken = this.twitch.publicMethods.getAccessToken();

            try {
                this.logger.info(`Creating ButtonHook ${hookData.name} ${hookData.description}`);
                const newHook = await this.apiClient.post(`/streams/${channelId}/hooks/`, hookData);
                this.logger.info(`Created ButtonHook ${newHook.data._id}`);

                this.buttonHooks.push(newHook.data);
                return newHook.data;

            }
            catch (err) {
                this.logger.error(`Error Creating Hook, ${err}`);
                return null;
            }
        },
        async updateButtonHook(hookId, hookData) {
            const channelId = this.twitch.publicMethods.getChannelId();
            const accessToken = this.twitch.publicMethods.getAccessToken();

            if (!accessToken) {
                this.logger.info(`Can't connect to BitButtons, no twitch sign on.`);
                return;
            }

            try {
                const newHook = await this.apiClient.put(`/streams/${channelId}/hooks/${hookId}`, hookData);
                const idx = this.buttonHooks.findIndex(h => h._id == hookId);
                this.buttonHooks[idx] = newHook.data;
                return newHook.data
            }
            catch (err) {
                this.logger.error(`Error Updating Hook, ${err}`);
            }
        },
        async deleteButtonHook(hookId) {
            const channelId = this.twitch.publicMethods.getChannelId();
            const accessToken = this.twitch.publicMethods.getAccessToken();

            if (!accessToken) {
                this.logger.info(`Can't connect to BitButtons, no twitch sign on.`);
                return;
            }

            try {
                await this.apiClient.delete(`/streams/${channelId}/hooks/${hookId}`)
                const idx = this.buttonHooks.findIndex(h => h._id == hookId);
                this.buttonHooks.splice(idx, 1);
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
                this.logger.info(`Connection to bitbuttons websocket (${process.env.VUE_APP_BITBUTTONS_URL}) failed, retrying in 5 seconds...`);
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
            const accessToken = this.twitch.publicMethods.getAccessToken();

            if (!accessToken) {
                this.logger.info(`Can't connect to BitButtons, no twitch sign on.`);
                this.apiClient = null;
                return;
            }

            this.logger.info(`Using BitButtons URL ${process.env.VUE_APP_BITBUTTONS_URL}`);

            this.apiClient = axios.create({
                baseURL: process.env.VUE_APP_BITBUTTONS_URL
            })

            this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            await this.initHookData();

            this.reconnect = true;

            this.websocket = new WebSocket(process.env.VUE_APP_BITBUTTONS_SOCKET_URL, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });

            this.websocket.on('open', () => {
                this.logger.info(`Connection to BitButtons open (${process.env.VUE_APP_BITBUTTONS_SOCKET_URL})`);

                this.requestSocket = new RequestSocket(this.websocket);

                this.requestSocket.handle("getHooks", () => this.getActiveHooks());
                this.requestSocket.handle("runHook", (hookId, context) => {
                    return this.triggers.buttonHook({ hookId, ...context, userColor: this.twitch.publicMethods.getUserColor(context.userId) })
                });

                this.requestSocket.call("setActiveHooks", Array.from(this.activeHooks));

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
            await this.loadButtonHooks();
        },
        async loadButtonHooks() {
            const channelId = this.twitch.publicMethods.getChannelId();
            const accessToken = this.twitch.publicMethods.getAccessToken();

            try {
                const resp = await this.apiClient.get(`/streams/${channelId}/hooks/`);

                this.logger.info(`Loaded Button Hooks (${resp.data.length})`);
                this.buttonHooks = resp.data;
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
        buttonHook: {
            name: "BitButton",
            description: "Fires when a BitButton is pressed",
            config: {
                type: Object,
                properties: {
                    hookId: { type: "BitButtonHook", name: "Button Hook" },
                }
            },
            context: {
                hookId: { type: String },
                bits: { type: Number },
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
        const buttonTriggers = config ? (config.triggers ? (config.triggers.bitbuttons ? (config.triggers.bitbuttons.buttonHook) : null) : null) : null;

        profile.buttonHooks = buttonTriggers ? buttonTriggers.map(rt => rt.config.hookId) : [];
    },
    async onProfilesChanged(activeProfiles, inactiveProfiles) {
        this.activeHooks = new Set();

        //Handle rewards
        for (let activeProf of activeProfiles) {
            for (let hookId of activeProf.buttonHooks) {
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
            name: "Connected To BitButtons",
            hidden: true,
        }
    }
}