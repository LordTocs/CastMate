import { app, ipcMain } from "./electronBridge.js"
import path from 'path'
import fs from "fs"

const nodeEnv = process.env.NODE_ENV || 'development'
const isDevelopment = nodeEnv === 'development';
const isPortable = process.argv.includes('--portable') || isDevelopment;
export const userFolder = path.resolve((!isPortable ? path.join(app.getPath('userData'), 'user') : './user'));

export const settingsFilePath = path.resolve(path.join(userFolder, "settings.yaml"));
export const secretsFilePath = path.resolve(path.join(userFolder, "secrets/secrets.yaml"));
export const rewardsFilePath = path.resolve(path.join(userFolder, "rewards.yaml"));
export const segmentsFilePath = path.resolve(path.join(userFolder, "segments.yaml"));
export const variablesFilePath = path.resolve(path.join(userFolder, "variables.yaml"));


function ensureFolder(path)
{
	if (!fs.existsSync(path))
	{
		fs.mkdirSync(path, { recursive: true });
	}
}

function ensureFile(path)
{
	if (!fs.existsSync(path))
	{
		fs.writeFileSync(path, "");
	}
}


export function ensureUserFolder()
{
	ensureFolder(userFolder);
	ensureFolder(path.join(userFolder, "data"));
	ensureFolder(path.join(userFolder, "profiles"));
	ensureFolder(path.join(userFolder, "secrets"));
	ensureFolder(path.join(userFolder, "sounds"));

	ensureFolder(path.join(userFolder, "automations"));

	ensureFile(rewardsFilePath);
	ensureFile(secretsFilePath);
	ensureFile(settingsFilePath);
	ensureFile(segmentsFilePath);
	ensureFile(variablesFilePath);
}

ipcMain.handle("getPaths", async () =>
{
	return {
		userFolder,
		secretsFilePath,
		settingsFilePath,
		rewardsFilePath,
		segmentsFilePath,
		variablesFilePath,
	};
})
