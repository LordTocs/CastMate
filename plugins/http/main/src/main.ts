import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	useHTTPRouter,
	onProfilesChanged,
	resetRouter,
} from "castmate-core"
import axios from "axios"

export default definePlugin(
	{
		id: "http",
		name: "HTTP",
		description: "UI Description",
		icon: "mdi mdi-web",
		color: "#9E436E",
	},
	() => {
		const endpointRoutes = useHTTPRouter("endpoints")

		defineAction({
			id: "request",
			name: "HTTP Request",
			icon: "mdi mdi-web",
			config: {
				type: Object,
				properties: {
					method: {
						type: String,
						name: "Method",
						enum: ["GET", "POST", "DELETE", "PUT", "PATCH"],
						required: true,
						default: "GET",
					},
					url: {
						type: String,
						template: true,
						name: "URL",
						required: true,
					},
					//TODO: Query
					//TODO: Headers
					//TODO: Body
				},
			},
			result: {
				type: Object,
				properties: {},
			},
			async invoke(config, contextData, abortSignal) {
				//TODO: Cancel Token
				const resp = await axios.request({
					method: config.method,
					url: config.url,
				})

				return resp.data
			},
		})

		const endpointTrigger = defineTrigger({
			id: "endpoint",
			name: "HTTP Endpoint",
			icon: "mdi mdi-server-network",
			description: "Responds to incoming HTTP requests at /plugins/endpoints/...",
			config: {
				type: Object,
				properties: {
					method: {
						type: String,
						name: "Method",
						enum: ["GET", "POST", "DELETE", "PUT", "PATCH"],
						default: "POST",
						required: true,
					},
					route: {
						type: String,
						name: "Route",
						required: true,
					},
				},
			},
			context: {
				type: Object,
				properties: {
					method: { type: String, name: "Method", required: true },
					route: { type: String, name: "Route", required: true },
					params: { type: Object, name: "URL Params", required: true, properties: {} },
					query: { type: Object, name: "Query Params", required: true, properties: {} },
					body: { type: Object, name: "Request Body", required: true, properties: {} },
				},
			},
			async handle(config, context, mapping) {
				return config.method == context.method && config.route == context.route
			},
		})

		onProfilesChanged((activeProfiles, inactiveProfiles) => {
			resetRouter(endpointRoutes)

			const routes: Record<string, Set<string>> = {
				GET: new Set<string>(),
				POST: new Set<string>(),
				DELETE: new Set<string>(),
				PUT: new Set<string>(),
				PATCH: new Set<string>(),
			}

			for (const profile of activeProfiles) {
				for (const trigger of profile.iterTriggers(endpointTrigger)) {
					const routeName = trigger.config.route

					routes[trigger.config.method]?.add(routeName)
				}
			}

			for (const method in routes) {
				for (const route of routes[method]) {
					endpointRoutes[method.toLowerCase() as "get" | "post" | "delete" | "put" | "patch"]?.(
						route,
						(req, res, next) => {
							endpointTrigger({
								method,
								route,
								params: req.params,
								query: req.query || {},
								body: req.body || {},
							})
							res.status(201).end()
							next()
						}
					)
				}
			}
		})
	}
)
