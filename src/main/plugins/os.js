
import path from "path"
import { template } from "../utils/template"
import { exec } from 'child_process'


async function shellCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (err, stdout, stderr) => {
            if (err)
                reject(err)
            resolve(stdout)
        })
    })
}

export default {
	name: "os",
	uiName: "OS",
	icon: "mdi-laptop",
	color: "#FFA256",
	async init() {
	},
	methods: {
	},
	settings: {
		globalVolume: {
			type: Number,
			name: "Global Volume",
			description: "Global Volume control.",
			slider: [0.0, 1.0],
			default: 1.0,
		}
	},
	secrets: {
	},
	actions: {
		shell: {
			name: "Command Line",
            description: "Execute a shell command",
			data: {
				type: Object,
				properties: {
					command: {
						type: "String",
						template: true,
						name: "Command"
					},
				}
			},
			icon: "mdi-application-cog-outline",
			color: "#FFA256",
			async handler(data, context) {
				const command = await template(data.command, context);

                await shellCommand(command)
			},
		}
	}
}