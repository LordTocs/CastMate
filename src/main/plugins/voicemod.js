import { WebSocket } from 'ws'
import { nanoid } from 'nanoid/non-secure'
import { AsyncCache } from '../utils/async-cache.js';
import { sleep } from '../utils/sleep.js';

class VoiceModClient {
    constructor() {
        this.socket = null;
        this.rpcCalls = {};
        this.handlers = {};

        this.voicePromise = null;
        this.connected = false;

        this._handle("getVoices", async (payload) => {
            if (this.voicePromise) {
                this.voiceResolver.resolve(payload);
                this.voiceResolver = null;
                this.voicePromise = null;
            }
        })
    }

    _send(message) {
        return new Promise((resolve, reject) => {
            //console.log("Sent: ", message)
            this.socket.send(JSON.stringify(message), (err) => {
                if (!err)
                    return resolve()
                return reject(err)
            })
        })
    }

    _handle(actionType, handler) {
        this.handlers[actionType] = handler
    }

    _callRPC(action, payload = {}) {
        if (!this.socket)
            return;

        const id = nanoid();
        
        return new Promise((resolve, reject) => {
            this.rpcCalls[id] = {
                resolve: (payload) => {
                    resolve(payload)
                },
                reject
            }

            const message = {
                id,
                action,
                payload
            }
            this._send(message)
        });
    }

    getVoices() {
        if (this.voicePromise)
            return this.voicePromise

        this.voicePromise = new Promise((resolve, reject) => {
            this.voiceResolver = { resolve, reject }          
            
            this._send({
                id: nanoid(),
                action: "getVoices",
                payload: {},
            })
        })

        return this.voicePromise
    }


    selectVoice(id) {
        this._send({
            id: nanoid(),
            action: "selectVoice",
            payload: {
                voiceID: id,
            }
        })
    }

    connect() {
        if (this.connected)
            return;
        return new Promise ((resolve, reject) => {
            this.socket = new WebSocket("ws://127.0.0.1:59129/v1/");

            this.socket.on("close", () => {
                this.connected = false;
                
                if (this.onClose) {
                    this.onClose();
                }
            })
        
            this.socket.on("open", async () => {
                await this._callRPC("registerClient", {clientKey: "castmate"});
                this.connected = true;
                resolve();
            });

            this.socket.on("message", async (data) => {
                try {
                    const message = JSON.parse(data);

                    //console.log("Received: ", message);

                    const id = message.id;

                    if (id) {
                        const rpc = this.rpcCalls[id]
                        rpc.resolve(message.payload)
                        return;
                    }

                    if (message.actionType) {
                        const handler = this.handlers[message.actionType];
                        //console.log("Event: ", message.actionType)
                        if (handler) {
                            handler(message.actionObject);
                        }
                    }
                }
                catch (err) {
                    return;
                }
            })

            this.socket.on("error", (err) => {
                reject();
                
                if (this.voicePromise) {
                    this.voicePromise.reject();
                    this.voiceResolver = null;
                    this.voicePromise = null;
                }
            })

            this.socket.on("unexpected-response", (err) => {
                reject();
            })
        })
    }
}


const icon = "svg:m 9.7815076,8.2017826 c -0.046505,0.003 -0.090018,0.016603 -0.1179623,0.04594 l -0.00252,5.8953444 1.6613247,-0.0049 v -2.860761 c 0.04222,-0.08071 0.175072,-0.05463 0.238396,0 l 6.247975,4.521461 -0.04967,-4.451928 c 0.0596,-0.104303 0.228463,-0.06456 0.288063,0 l 2.523028,2.016435 h 2.87069 L 16.457807,8.2372049 c -0.07574,-0.042216 -0.309168,-0.036005 -0.357595,0 v 4.2520231 c -0.0149,0.1192 -0.263225,0.104303 -0.367528,0.01987 L 9.9813723,8.2477637 C 9.9448983,8.2206008 9.858984,8.1967296 9.7814667,8.2018234 Z M 0.55916771,8.2049061 8.8316462,15.798825 V 8.2198067 l -1.6278001,-0.00997 v 3.7466727 c 0.00388,0.11252 -0.2658679,0.162967 -0.4171936,0 L 3.0884043,8.2098522 Z"
export default {
	name: "voicemod",
	uiName: "VoiceMod",
	icon,
	color: "#3F918D",
	async init() {
        this.voicemod = new VoiceModClient();

        this.voicemod.onClose = async () => {
            this.logger.info('VoiceMod Connection Closed');
            this.retryConnection();
        }

        this.tryConnect();

        this.voiceCache = new AsyncCache(async () => {
            if (!this.voicemod.connected)
                return [];
            return await this.voicemod.getVoices();
        })
	},
    methods: {
        async tryConnect() {
            this.logger.info('Trying voicemod connection');
            try {
                await this.voicemod.connect()
            }
            catch
            {
                
            }
        },
        retryConnection() {
            setTimeout(async () => {
                await this.tryConnect();
            }, 30 * 1000);
        }
    },
	actions: {
		selectVoice: {
			name: "Select Voice",
            description: "Select which voice to use in VoiceMod",
			data: {
				type: Object,
				properties: {
					voice: {
						type: String,
						name: "Voice",
                        required: true,
                        default: 'nofx',
                        async enum() {
                            const { voices } = await this.voiceCache.get();
                            return voices.filter(v => v.enabled).map(v => v.id);
                        }
					},
				}
			},
			icon,
			color: "#3F918D",
			async handler(data) {
                if (!this.voicemod.connected)
                    return;

                this.voicemod.selectVoice(data.voice);
            }
        }
    }
}