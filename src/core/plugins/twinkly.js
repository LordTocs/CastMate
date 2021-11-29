const { template } = require('../utils/template');
const Twinkly = require('twinkly-api');
const axios = require('axios');
const crypto = require('crypto')
const Color = require('color');

function randomBytes(num) {
    return new Promise((resolve, reject) => {
        crypto.randomBytes(num, (err, buf) => {
            if (err) { reject(err) }
            resolve(buf);
        });
    })
}


module.exports = {
    name: "twinkly",
    uiName: "Twinkly",
    async init() {
        //this.twinkly = new Twinkly(this.settings.twinklyIP);
        this.logger.info('Twinkly Effects');

        const movies = await this.getAllMovies();

        for (let movie of movies.movies) {
            this.logger.info(`${movie.name}: ${movie.id}`);
        }

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

                this.logger.info(this.creds.authentication_token)

                const resp2 = await this.postApi('verify', {
                    "challenge-response": this.creds["challenge-response"]
                });

                this.logger.info(`Successfully verified ${JSON.stringify(resp2.data)}`);

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
        async setColor(cssColor) {
            const color = Color(cssColor);

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
        }
    },
    settings: {
        twinklyIP: { type: String }
    },
    secrets: {
        password: { type: String }
    },
    state: {},
    actions: {
        twinklyMovie: {
            name: "Twinkly Movie",
            description: "Change Twinkly mode.",
            color: "#607A7F",
            data: {
                type: Object,
                properties: {
                    movie: { type: Number },
                }
            },
            async handler(twinklyData, context) {
                this.logger.info("Changing twinkly movie to " + twinklyData.movie);
                await this.setMovie(twinklyData.movie);
                await this.setMode('movie')
            },
        },
        twinklyColor: {
            name: "Twinkly Color",
            description: "Change Twinkly to a solid color.",
            color: "#607A7F",
            data: {
                type: Object,
                properties: {
                    color: { type: "TemplateString" },
                }
            },
            async handler(twinklyData, context) {
                this.logger.info("Changing twinkly color to " + twinklyData.color);
                await this.setColor(await template(twinklyData.color, context))
                await this.setMode('color')
            },
        },
    }
}