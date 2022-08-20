import path from 'path'
import { userFolder } from "../utils/configuration.js"
import logger from "../utils/logger.js"
import { sleep } from "../utils/sleep.js"
import YAML from "yaml"
import fs from 'fs'
import { ipcFunc, ipcMain } from "../utils/electronBridge.js"
import _cloneDeep from "lodash/cloneDeep"

export class AutomationManager
{
	constructor()
	{
		this.automations = {};

		this.createIOFuncs();

		ipcMain.handle('core_getAutomations', () => {
			return Object.keys(this.automations);
		})
	}

	createIOFuncs() {
		ipcFunc("io", "getAutomations", () => {
			return Object.keys(this.automations);
		})
		ipcFunc("io", "getAutomation", (name) => {
			return this.automations[name];
		})
		ipcFunc("io", "saveAutomation", async (name, config) => {
			try
			{
				await fs.promises.writeFile(path.join(userFolder, 'automations/', `${name}.yaml`), YAML.stringify(config), 'utf-8')
			}
			catch (err)
			{
				logger.error(`Error saving automation. ${err}`);
				return false;
			}
			this.automations[name] = config;
			return true;
		})
		ipcFunc("io", "createAutomation", async (name, config) => {
			if (name in this.automations)
			{
				return false;
			}

			if (!config) {
				config = {
					version: "1.0",
					description: "",
					actions: [],
				}
			}

			try
			{
				await fs.promises.writeFile(path.join(userFolder, 'automations/', `${name}.yaml`), YAML.stringify(config), 'utf-8')
			}
			catch (err)
			{
				logger.error(`Error saving automation. ${err}`);
				return false;
			}
			this.automations[name] = config;
			return true;
		})
		ipcFunc("io", "deleteAutomation", async (name) => {
			if (!(name in this.automations))
				return false;

			delete this.automations[name];

			try
			{
				await fs.promises.unlink(path.join(userFolder, 'automations/', `${name}.yaml`));
			}
			catch(err)
			{
				logger.error(`Error deleting automation. ${err}`);
				return false;
			}
			return true;
		})
		ipcFunc("io", "cloneAutomation", async (name, newName) => {
			if (!(name in this.automations) || newName in this.automations)
				return false;

			const config = _cloneDeep(this.automations[name]);

			try
			{
				await fs.promises.writeFile(path.join(userFolder, 'automations/', `${newName}.yaml`), YAML.stringify(config), 'utf-8')
			}
			catch (err)
			{
				logger.error(`Error saving automation. ${err}`);
				return false;
			}

			this.automations[newName] = config;
			return true;
		})
	}

	async load()
	{
		const automationFolder = path.join(userFolder, 'automations/');
		logger.info(`Automation Folder ${automationFolder}`);
		const files = await fs.promises.readdir(automationFolder);
		const automationFiles = files.filter(f => path.extname(f) == '.yaml');
		logger.info(`Loaded ${automationFiles.length}:${files.length} Automations`)

		const automations = await Promise.all(automationFiles.map(async (f) => 
		{
			try
			{
				const str = await fs.promises.readFile(path.join(userFolder, 'automations/', f), 'utf-8');
				return { name: path.parse(f).name, config: YAML.parse(str) };
			}
			catch(err)
			{
				logger.error(`Failed to load automation ${f} : ${err}`);
			}
		}));

		for (let a of automations)
		{
			if (a)
			{
				this.automations[a.name] = a.config;
			}
		}
	}

	get(automationName) { return this.automations[automationName] }
}

