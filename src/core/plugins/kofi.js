
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
				if (req.body.type == "Donation")
				{
					this.actions.trigger('kofiDonation', {
						number: Number(req.body.amount),
						currency: req.body.currency,
						user: req.body.from_name,
						message: req.body.message,
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