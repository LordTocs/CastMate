const fs = require('fs');
const path = require('path');
const { userFolder } = require('../utils/configuration');
const nanoid = require('nanoid');
const { WebSocket } = require('ws');
const { onStateChange } = require('../utils/reactive');

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
                    const result = data.result;
                    if (result === undefined) {
                        outstandingCall.reject();
                        return;
                    }
                    outstandingCall.resolve(result);
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
                try {
                    this.handlers[requestName](requestId, ...args);
                }
                catch
                {
                    await this.socket.send(JSON.stringify({
                        responseId: requestId,
                        failed: true,
                    }))
                }
            }
        })
    }

    handle(name, func) {
        this.handlers[name] = async (requestId, ...args) => {
            const result = await func(...args);

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
    icon: "mdi-currency-usd",
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
    methods: {
        async retry() {
            await this.disconnect();

            //Retry connection in 5 seconds.
            if (this.reconnect) {
                this.logger.info(`Connection to bitbuttons websocket failed, retrying in 5 seconds...`);
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
                return;
            }

            this.reconnect = true;

            this.websocket = new WebSocket('ws://localhost:8777', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                }
            });

            this.websocket.on('open', () => {
                this.logger.info(`Connection to BitButtons open`);

                this.requestSocket = new RequestSocket(this.websocket);

                this.requestSocket.handle("getAutomations", () => this.getAutomations());
                this.requestSocket.handle("runAutomation", (automation, context) => this.runAutomation(automation, context));

                this.websocketPinger = setInterval(() => {
                    this.websocket.ping()
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
        async getAutomations() {
            return this.actions.automations.getAllAutomations();
        },
        async runAutomation(automation, context) {
            console.log("BitButton Request ", automation);
            return this.actions.startAutomation(automation, context);
        }

    },
    async onAutomationCreated(automationName) {
        if (!this.requestSocket)
            return;

        const automation = this.actions.automations.get(automationName);
        if (!automation)
            return;

        await this.requestSocket.call('automationCreated', { name: automationName, description: automation.description });
    },
    async onAutomationDeleted(automationName) {
        if (!this.requestSocket)
            return;

        await this.requestSocket.call('automationDeleted', automationName);
    },
    async onAutomationUpdated(automationName) {
        if (!this.requestSocket)
            return;

        const automation = this.actions.automations.get(automationName);
        if (!automation)
            return;

        await this.requestSocket.call('automationUpdated', { name: automationName, description: automation.description });
    },
    state: {
        connected: {
            type: Boolean,
            name: "Connected To BitButtons",
            hidden: true,
        }
    }
}