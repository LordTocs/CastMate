
import path from "path"
import { template } from "../utils/template"
import { exec } from 'child_process'
import express from 'express'
import axios from "axios"

export default {
	name: "http",
	uiName: "HTTP",
	icon: "mdi-web",
	color: "#9E436E",
	async init() {
        this.router = express.Router();

        this.webServices.routes.use('/endpoints/', this.router);
	},
    onProfilesChanged(activeProfiles, inactiveProfiles)
    {
        this.router.stack = []
        this.router.params = {}
        this.router._params = []

        const routes = {};
        
        for (let profile of activeProfiles) {
            const triggers = profile?.triggers?.http?.endpoint;

            if (!triggers)
                continue;

            for (let endpoint of triggers) {
                if (!endpoint.config)
                    continue;

                if (!(endpoint.config.method in routes))
                    routes[endpoint.config.method] = new Set()

                routes[endpoint.config.method].add(endpoint.config.route);
            }
        }

        for (let method in routes) {
            for (let route of routes[method]) {
                this.router[method.toLowerCase()](route, (req, res, next) => {
                    console.log("Hello!")
                    this.triggers.endpoint({ 
                        method: method, 
                        route: route, 
                        params: req.params,
                        query: req.query || {},
                        body: req.body || {},
                    })
                    res.status(201).end();
                    next();
                })
            }
        }
    },
	actions: {
		request: {
			name: "HTTP Request",
            description: "Send an HTTP Request",
			data: {
				type: Object,
				properties: {
                    method: {
                        type: String,
                        name: "Method",
                        enum: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
                        default: 'GET',
                    },
					address: {
						type: String,
						template: true,
						name: "Address"
					},
                    body: {
                        type: String,
                        template: true,
                        name: "Body String"
                    }
				}
			},
			icon: "mdi-web",
			color: "#9E436E",
			async handler(data, context) {
				const [addr, body] = await Promise.all([await template(data.address, context), await template(data.body || "", context)]);

                const resp = await axios.request({
                    url: addr,
                    method: data.method,
                    body
                })

			},
		}
	},
    triggers: {
        endpoint: {
            name: "HTTP Endpoint",
            description: "Respond to incoming HTTP Requests at /endpoints/...",
            config: {
                type: Object,
                properties: {
                    method: {
                        type: String,
                        name: "Method",
                        enum: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
                        default: 'GET',
                    },
                    route: {
                        type: String,
                        name: "Route",
                    }
                }
            },
            context: {
                params: { type: "Object", name: "URL Params"},
                query: { type: "Object", name: "Query Params"},
                body: { type: "Object", name: "Request Body"},
            },
            handler(config, context) {
                return config.method == context.method && config.route == context.route
            }
        }
    }
}