import {template} from '../utils/template.js'
import {WebSocket} from 'ws'

export default {
    name: "websocketActions",
    uiName: "Websocket Interactions",
    icon: "mdi-code-json",
    color: "#66a87b",
    async init() {
        this.tryConnect().catch((err) => this.handleConnectionErrors(err));
    },
    methods: {
        async tryConnect() {
            try {
                this.ws = new WebSocket(`ws://${this.settings.host}:${this.settings.port}${this.settings.appendix ?? ''}`);

                this.ws.addEventListener('open', _ => {
                    this.logger.info(`Castmate connected to ${this.settings.host}:${this.settings.port}!`);
                });


                this.ws.addEventListener('error', _ => {
                    this.logger.info(`failed to establish connection to ${this.settings.host}:${this.settings.port}`);
                });


                this.ws.addEventListener('close', _ => {
                    this.logger.info(`Socket is closed.`);
                });
            } catch (err) {
                this.logger.info(`Rejecting Connection promise because of error`);
                this.logger.error(err);
            }
        },

        async shutdown() {
            if (this.ws && this.ws.readyState !== WebSocket.CLOSED) {
                this.ws.close();
            }
        },

        handleConnectionErrors(err) {
            this.logger.info("Failed to establish connection");
            this.logger.info(err);
        },
    },

    async onSettingsReload() {
        this.logger.info("Retrying WS connection on settings reload");
        try {
            await this.shutdown();
            await this.tryConnect().catch((err) => this.handleConnectionErrors(err));
        } catch (e) {
            this.logger.info("Reconnection for WS Plugin failed on reload");
        }
    },
    async onSecretsReload() {
        try {
            await this.shutdown();
            await this.tryConnect().catch((err) => this.handleConnectionErrors(err));
        } catch (e) {
            this.logger.info("Reconnection for WS Plugin failed on reload");
        }
    },
    settings: {
        host: {type: String, name: "Server"},
        port: {type: Number, name: "Port"},
        appendix: {type: String, name: "Appendix (optional)"}
    },
    secrets: {
        password: {type: String, name: "Websocket Password"}
    },
    actions: {
        wsSend: {
            name: "Send to Websocket Server",
            icon: "mdi-upload",
            color: "#66a87b",
            data: {
                type: Object,
                properties: {
                    messageToSend: {type: String, template: true}
                }
            },
            async handler(command, context) {
                if (!this.ws) {
                    this.logger.warn("Tried to use WS action before connecting to endpoint");
                    return;
                }
                try {
                    this.logger.info(`WS Send Start`);
                    this.ws.send(await template(command.messageToSend, context));
                    this.logger.info(`WS Send Success`);
                } catch (err) {
                    this.logger.info(`WS Send Failed`);
                    this.logger.error(err);
                }
            }
        }
    }
}
