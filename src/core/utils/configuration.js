const { app, ipcMain } = require("electron");
const path = require('path');
const fs = require("fs");

const isPortable = process.argv.includes('--portable');
const userFolder = path.resolve((!isPortable ? path.join(app.getPath('userData'), 'user') : './user'));

const settingsFilePath = path.resolve(path.join(userFolder, "settings.yaml"));
const secretsFilePath = path.resolve(path.join(userFolder, "secrets/secrets.yaml"));
const rewardsFilePath = path.resolve(path.join(userFolder, "rewards.yaml"));


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


function ensureUserFolder()
{
	ensureFolder(userFolder);
	ensureFolder(path.join(userFolder, "data"));
	ensureFolder(path.join(userFolder, "profiles"));
	ensureFolder(path.join(userFolder, "secrets"));

	ensureFolder(path.join(userFolder, "sequences"));
	ensureFolder(path.join(userFolder, "sounds"));
	ensureFolder(path.join(userFolder, "commands"));

	ensureFile(rewardsFilePath);
	ensureFile(secretsFilePath);
	ensureFile(settingsFilePath);
}

ipcMain.handle("getPaths", async () =>
{
	return {
		userFolder,
		secretsFilePath,
		settingsFilePath,
		rewardsFilePath,
	};
})


module.exports = {
	ensureUserFolder,
	userFolder,

	secretsFilePath,
	settingsFilePath,
	rewardsFilePath
}