import { loadYAML, resolveProjectPath, writeYAML } from "../io/file-system"
import { Service } from "../util/service"
import fs from "fs"
import { app } from "electron"
import { defineIPCFunc } from "../util/electron"

import electronUpdater, { autoUpdater, UpdateInfo, CancellationToken } from "electron-updater"
import { UpdateData } from "castmate-schema"
import { globalLogger } from "../logging/logging"
import path from "path"

interface StartInfo {
	lastVer: string
}

export const InfoService = Service(
	class {
		startInfo: StartInfo | undefined
		firstTimeStartup: boolean = false

		updateInfo: UpdateInfo | undefined = undefined

		constructor() {
			autoUpdater.autoInstallOnAppQuit = false
			autoUpdater.autoDownload = false
			//globalLogger.log("Update Config", path.join(app.getAppPath(), "dev-app-update.yml"))
			if (!app.isPackaged) {
				autoUpdater.forceDevUpdateConfig = true
			}

			defineIPCFunc("info", "isFirstTimeStartup", () => {
				return this.firstTimeStartup
			})

			defineIPCFunc("info", "getUpdateInfo", () => {
				if (!this.updateInfo) return undefined

				return {
					version: this.updateInfo.version,
					name: this.updateInfo.releaseName ?? "",
					date: this.updateInfo.releaseDate,
					notes: this.updateInfo.releaseNotes ?? "",
				} as UpdateData
			})

			defineIPCFunc("info", "hasUpdate", () => {
				return this.updateInfo != null
			})

			defineIPCFunc("info", "updateCastMate", async () => {
				await autoUpdater.downloadUpdate()
				autoUpdater.quitAndInstall()
			})
		}

		private async checkStartup() {
			const startInfoPath = resolveProjectPath("start-info.yaml")

			if (fs.existsSync(startInfoPath)) {
				this.startInfo = await loadYAML(startInfoPath)
			} else {
				//FIRST STARTUP
				this.firstTimeStartup = true
			}

			await this.writeStartInfo()
		}

		private async writeStartInfo() {
			this.startInfo = {
				lastVer: app.getVersion(),
			}

			await writeYAML(this.startInfo, "start-info.yaml")
		}

		async checkUpdate() {
			const result = await autoUpdater.checkForUpdates()
			if (result != null) {
				globalLogger.log("Update!", result.updateInfo.releaseName, result.updateInfo.version)
				this.updateInfo = result.updateInfo
				return true
			} else {
				globalLogger.log("No Update :(")
			}
			return false
		}

		async checkInfo() {
			await this.checkStartup()
			await this.checkUpdate()
		}
	}
)
