const chokidar = require("chokidar");
const path = require('path');
const { userFolder } = require("../utils/configuration");
const logger = require("../utils/logger");
const { sleep } = require("../utils/sleep");
const YAML = require("yaml");
const fs = require('fs');
const { ipcMain } = require("electron");

class AutomationManager
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

module.exports = { AutomationManager }