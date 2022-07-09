import chokidar from "chokidar"
import path from 'path'
import { userFolder } from "../utils/configuration.js"
import logger from "../utils/logger.js"
import { sleep } from "../utils/sleep.js"
import YAML from "yaml"
import fs from 'fs'
import { ipcMain } from "../utils/electronBridge.js"

export class AutomationManager
{
	constructor()
	{
		this.automations = {};

		ipcMain.handle('core_getAutomations', () => {
			return Object.keys(this.automations);
		})
	}

	async load()
	{
		this.automationWatcher = chokidar.watch(path.join(userFolder, 'automations/'));

		this.automationWatcher.on('add', async (filePath) =>
		{
			logger.info(`Automation Added: ${filePath}`);
			await sleep(50);

			const automationName = path.basename(filePath, '.yaml')

			this.automations[automationName] = YAML.parse(await fs.promises.readFile(filePath, 'utf-8'));
		});
		this.automationWatcher.on('change', async (filePath) =>
		{
			logger.info(`Automation Changed: ${filePath}`);

			const automationName = path.basename(filePath, '.yaml')
		
			await sleep(50);

			this.automations[automationName] = YAML.parse(await fs.promises.readFile(filePath, 'utf-8'));
		});
		this.automationWatcher.on('unlink', (filePath) =>
		{
			logger.info(`Automation Removed: ${filePath}`);

			const automationName = path.basename(filePath, '.yaml')

			delete this.automations[automationName];
		});
	}

	get(automationName) { return this.automations[automationName] }
}

