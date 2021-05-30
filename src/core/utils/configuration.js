const { app, ipcMain } = require("electron");
const path = require('path');
const fs = require("fs");

const isPortable = process.argv.includes('--portable');
const userFolder = (!isPortable ? path.join(app.getPath('userData'), 'user') : './user');

const settingsFilePath = path.join(userFolder, "settings.yaml");
const secretsFilePath = path.join(userFolder, "secrets/secrets.yaml");
const rewardsFilePath = path.join(userFolder, "rewards.yaml");


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
	console.log("Ensuring User Folder: ", userFolder);

	ensureFolder(userFolder);
	ensureFolder(path.join(userFolder, "data"));
	ensureFolder(path.join(userFolder, "profiles"));
	ensureFolder(path.join(userFolder, "secrets"));

	ensureFolder(path.join(userFolder, "sequences"));
	ensureFolder(path.join(userFolder, "sounds"));
	ensureFolder(path.join(userFolder, "triggers"));

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