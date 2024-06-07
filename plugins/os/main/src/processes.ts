import { defineAction } from "castmate-core"
import { Directory, FilePath } from "castmate-schema"
import { ChildProcess, exec, spawn } from "child_process"
import * as path from "path"

function isRunning(application: string) {
	return new Promise<boolean>(function (resolve, reject) {
		const plat = process.platform
		const cmd: string = "tasklist"
		//plat == "win32" ? "tasklist" : plat == "darwin" ? "ps -ax | grep " + mac : plat == "linux" ? "ps -A" : ""
		if (cmd === "" || application === "") {
			resolve(false)
		}
		exec(cmd, function (err, stdout, stderr) {
			//TODO: Case insentivity here?
			resolve(stdout.toLowerCase().indexOf(application.toLowerCase()) > -1)
		})
	})
}

export function setupProcesses() {
	defineAction({
		id: "launch",
		name: "Launch App",
		description: "Easily Launch an Application. Working directory defaults to application folder",
		icon: "mdi mdi-launch",
		config: {
			type: Object,
			properties: {
				application: { type: FilePath, name: "Application", required: true, extensions: ["exe"] },
				dir: { type: Directory, name: "Working Directory" },
				args: {
					type: Array,
					items: { type: String, required: true, template: true },
					name: "Arguments",
					required: true,
				},
				ignoreIfRunning: {
					type: Boolean,
					name: "Ignore If Already Running",
					default: true,
					required: true,
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			if (config.ignoreIfRunning) {
				if (await isRunning(path.basename(config.application))) {
					return
				}
			}

			let cwd = config.dir
			if (!cwd) {
				cwd = path.dirname(config.application)
			}

			spawn("cmd", ["/c", "start", "CastMate Launch", config.application, ...config.args], {
				cwd,
				detached: true,
			})
		},
	})
}
