import { evalTemplate } from '../state/template.js'
import axios from 'axios'
import crypto from 'crypto'
import Color from 'color'

function randomBytes(num) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(num, (err, buf) => {
            if (err) { reject(err) }
            resolve(buf);
        });
    })
}


export default {
    name: "twinkly",
    uiName: "Twinkly",
    icon: "mdi-string-lights",
    color: "#7F743F",
    async init() {
        this.logger.info('Twinkly Effects');
    },
    methods: {
        getBaseUrl() {
            return `http://${this.settings.twinklyIP}:80/xled/v1/`;
        },
        async doLogin() {

            const randomBuffer = await randomBytes(32);
            const token = randomBuffer.toString('base64');
            try {
                this.logger.info('Logging into Twinkly');
                const resp = await axios.post(`${this.getBaseUrl()}login`, { challenge: token });

                this.creds = resp.data;
                this.credsExpiry = new Date().getTime() + ((this.creds.authentication_token_expires_in * 1000) - 5000)

                const resp2 = await this.postApi('verify', {
                    "challenge-response": this.creds["challenge-response"]
                });

                this.analytics.set({ usesTwinkly: true });

            } catch (err) {
                this.logger.error('Twinkly Auth Error');
                this.logger.error(err.toString());
                this.creds = null;
                return false;
            }
            return true;
        },
        isLoggedIn() {
            if (!this.creds)
                return false;
            if (!this.creds.authentication_token)
                return false;
            if (this.credsExpiry <= new Date().getTime()) {
                return false;
            }
            return true;
        },
        async postApi(endpoint, data) {
            if (!this.isLoggedIn()) {
                if (!await this.doLogin()) {
                    return;
                }
            }
            this.logger.info(`Posting to ${endpoint}`)
            try {
                return await axios.post(`${this.getBaseUrl()}${endpoint}`, data, {
                    headers: {
                        'X-Auth-Token': this.creds.authentication_token,
                    }
                });
            } catch (err) {
                if (err.response.status == 401) {
                    this.creds = null;

                    if (!await this.doLogin()) {
                        return;
                    }

                    return await axios.post(`${this.getBaseUrl()}${endpoint}`, data, {
                        headers: {
                            'X-Auth-Token': this.creds.authentication_token,
                        }
                    });
                }
                throw err;
            }
        },
        async getApi(endpoint) {
            if (!this.isLoggedIn()) {
                if (!await this.doLogin()) {
                    this.logger.warn('Failed auth')
                    return null;
                }
            }

            this.logger.info(`Getting ${endpoint}`)

            try {
                return await axios.get(`${this.getBaseUrl()}${endpoint}`, {
                    headers: {
                        'X-Auth-Token': this.creds.authentication_token,
                    }
                });
            } catch (err) {
                if (err.response.status == 401) {
                    this.creds = null;

                    if (!await this.doLogin()) {
                        return;
                    }

                    return await axios.get(`${this.getBaseUrl()}${endpoint}`, {
                        headers: {
                            'X-Auth-Token': this.creds.authentication_token,
                        }
                    });
                }
                throw err;
            }
        },
        async setMode(mode, effectID) {

            const data = { mode };

            if (effectID) {
                data.effect_id = "00000000-0000-0000-0000-" + ("000000000000" + effectID.toString(16)).slice(-12);
            }

            this.logger.info('Twinkly Set Mode' + JSON.stringify(data));

            return await this.postApi('led/mode', { mode, effect_id: effectID })
        },
        async setMovie(movieId) {
            return await this.postApi('movies/current', { id: movieId });
        },
        async setColor(hsb) {
            const color = Color({
                h: hsb.hue,
                s: hsb.sat,
                v: hsb.bri
            });

            const rgb = color.rgb();
            this.postApi('led/color', {
                red: rgb.red(),
                green: rgb.green(),
                blue: rgb.blue()
            })
        },
        async getAllEffects() {
            const resp = await this.getApi('led/effects');
            return resp.data;
        },
        async getAllMovies() {
            const resp = await this.getApi('movies');
            return resp.data;
        },
        async handleTemplateNumber(value, context) {
            if (typeof value === 'string' || value instanceof String) {
                return await evalTemplate(value, context)
            }
            return value;
        },
        async resolveHSBK(hsbk, context) {
            const result = {};

            if ("bri" in hsbk && (hsbk.mode == 'color' || hsbk.mode == "template")) {
                result.bri = await this.handleTemplateNumber(hsbk.bri, context);
            }
            if ("sat" in hsbk && (hsbk.mode == 'color' || hsbk.mode == "template")) {
                result.sat = await this.handleTemplateNumber(hsbk.sat, context);
            }
            if ("hue" in hsbk && (hsbk.mode == 'color' || hsbk.mode == "template")) {
                result.hue = await this.handleTemplateNumber(hsbk.hue, context);
            }

            return result;
        },
    },
    settings: {
        twinklyIP: { type: String }
    },
    secrets: {
    },
    state: {},
    actions: {
        twinklyMovie: {
            name: "Twinkly Movie",
            description: "Play a twinkly movie.",
            color: "#607A7F",
            icon: "mdi-string-lights",
            data: {
                type: Object,
                properties: {
                    movie: {
                        type: String,
                        async enum() {
                            try {
                                const movies = await this.getAllMovies();
                                return movies.movies.map(m => m.name);
                            }
                            catch
                            {
                                return [];
                            }
                        }
                    },
                }
            },
            async handler(twinklyData, context) {
                this.logger.info("Changing twinkly movie to " + twinklyData.movie);

                const movies = await this.getAllMovies();
                if (!movies.movies)
                {
                    return;
                }

                const movie = movies.movies.find(m => m.name == twinklyData.movie);
                if (!movie)
                    return;
                
                await this.setMovie(movie.id);
                await this.setMode('movie')
            },
        },
        twinklyColor: {
            name: "Twinkly Color",
            description: "Change Twinkly to a solid color.",
            color: "#607A7F",
            icon: "mdi-string-lights",
            data: {
                type: Object,
                properties: {
                    hsbk: { type: "LightColor", name: "Color", tempRange: [2000, 6500] },
                }
            },
            async handler(twinklyData, context) {
                this.logger.info("Changing twinkly color to " + twinklyData.color);
                await this.setColor(await this.resolveHSBK(twinklyData.hsbk, context))
                await this.setMode('color')
            },
        },
    },
}