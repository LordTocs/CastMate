import fs from "fs"
import path from "path"
import { userFolder } from "../utils/configuration.js"
import { inRange } from "../utils/range.js"

export default {
	name: "kofi",
	uiName: "Kofi",
	icon: "mdi-currency-usd",
	color: "#72AADB",
	async init() {
		this.installWebhook()
		this.state.kofiTotal = 0
		if (fs.existsSync(path.join(userFolder, "data/kofiTotal.json"))) {
			let kofiTotal = JSON.parse(
				fs.readFileSync(
					path.join(userFolder, "data/kofiTotal.json"),
					"utf-8"
				)
			)
			this.state.kofiTotal = kofiTotal.total
		}
	},
	methods: {
		async installWebhook() {
			const routes = this.webServices.routes
			routes.post(`/kofi`, (req, res) => {
				let data = JSON.parse(req.body.data)
				if (data.type == "Donation") {
					this.triggers.donation({
						amount: Number(data.amount),
						currency: data.currency,
						user: data.from_name,
						message: data.message,
					})

					this.state.kofiTotal += Number(data.amount)
					let kofiJSON = { total: this.state.kofiTotal }
					fs.writeFileSync(
						path.join(userFolder, "data/kofiTotal.json"),
						JSON.stringify(kofiJSON)
					)
				}

				res.writeHead(200, { "Content-Type": "text/plain" })
				res.end()
			})
		},
	},
	triggers: {
		donation: {
			name: "Kofi Donation",
			description: "Fires when you receive a Kofi Donation",
			config: {
				type: Object,
				properties: {
					amount: {
						type: "Range",
						name: "Currency Donated",
						default: { min: 0 },
					},
				},
			},
			context: {
				amount: { type: Number },
				currency: { type: String, name: "Currency" },
				user: { type: String, name: "Donation Name" },
				message: { type: String, name: "Donation Message" },
			},
			handler(config, context) {
				return inRange(context.amount, config.amount)
			},
		},
	},
	state: {
		kofiTotal: {
			type: Number,
			name: "Kofi Total",
		},
	},
}
