import { loadYAML, resolveProjectPath, writeYAML } from "../io/file-system"
import { Service } from "../util/service"
import fs from "fs"
import { app } from "electron"
import { defineIPCFunc } from "../util/electron"

import electronUpdater, { autoUpdater, UpdateInfo, CancellationToken } from "electron-updater"
import { UpdateData } from "castmate-schema"
import { globalLogger, usePluginLogger } from "../logging/logging"
import path from "path"

import semver from "semver"

interface StartInfo {
	lastVer: string
}

const logger = usePluginLogger("info-manager")

export const InfoService = Service(
	class {
		startInfo: StartInfo | undefined
		firstTimeStartup: boolean = false

		get version() {
			return app.getVersion()
		}

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
			try {
				const result = await autoUpdater.checkForUpdates()
				if (result != null) {
					if (semver.gt(result.updateInfo.version, app.getVersion())) {
						globalLogger.log("Update!", result.updateInfo.releaseName, result.updateInfo.version)
						this.updateInfo = result.updateInfo
						return true
					}
					return false
				} else {
					globalLogger.log("No Update :(")
				}
				return false
			} catch (err) {
				logger.error("Error Checking Update", err)
				return false
			}
		}

		async checkInfo() {
			await this.checkStartup()
			await this.checkUpdate()
		}
	}
)
