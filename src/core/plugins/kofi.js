
module.exports = {
	name: "kofi",
	uiName: "Kofi",
	async init()
	{
		this.installWebhook()
	},
	methods: {
		async installWebhook()
		{
			const routes = this.webServices.routes;
			routes.post(`/kofi`, (req, res) =>
			{
				console.log("KOFI!")
				console.log(req.body);
				let data = JSON.parse(req.body.data);
				if (data.type == "Donation")
				{
					this.actions.trigger('kofiDonation', {
						number: Number(data.amount),
						currency: data.currency,
						user: data.from_name,
						message: data.message,
					})
				}

				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end();
			});
		}
	},
	triggers: {
		kofiDonation: {
			name: "Kofi Donation",
			description: "Fires when you receive a Kofi Donation",
			type: "NumberAction"
		},
	}
}