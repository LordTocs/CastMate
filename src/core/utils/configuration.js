const { app, ipcMain } = require("electron");
const path = require('path');
const fs = require("fs");
const YAML = require('yaml');

//DEMO BEGIN
//DEMO IS ALWAYS PORTABLE DONT SHIP INSTALLER DONT DO IT DUMMY
const isPortable = true; //process.argv.includes('--portable');
//END DEMO
const userFolder = path.resolve((!isPortable ? path.join(app.getPath('userData'), 'user') : './user'));

const settingsFilePath = path.resolve(path.join(userFolder, "settings.yaml"));
const secretsFilePath = path.resolve(path.join(userFolder, "secrets/secrets.yaml"));
const rewardsFilePath = path.resolve(path.join(userFolder, "rewards.yaml"));
const buttonsFilePath = path.resolve(path.join(userFolder, "buttons.yaml"));
const segmentsFilePath = path.resolve(path.join(userFolder, "segments.yaml"));
const variablesFilePath = path.resolve(path.join(userFolder, "variables.yaml"));


function ensureFolder(path, onCreate) {
	if (!fs.existsSync(path)) {
		fs.mkdirSync(path, { recursive: true });
		if (onCreate) {
			onCreate(path);
		}
	}
}

function ensureFile(path, getData) {
	if (!fs.existsSync(path)) {
		let data = getData ? getData() : "";
		if (typeof data != 'string' && !(data instanceof String)) {
			data = YAML.stringify(data);
		}
		fs.writeFileSync(path, data);
	}
}


function ensureUserFolder() {
	ensureFolder(userFolder);
	ensureFolder(path.join(userFolder, "data"));
	ensureFolder(path.join(userFolder, "profiles"));
	ensureFolder(path.join(userFolder, "secrets"));

	//DEMO BEGIN
	ensureFolder(path.join(userFolder, "sounds"), (p) => {
		fs.promises.copyFile(`./bundled_assets/bonk.mp3`, path.join(p, 'bonk.mp3'))
	});
	//DEMO END

	ensureFolder(path.join(userFolder, "automations"));

	ensureFile(rewardsFilePath);
	ensureFile(buttonsFilePath);
	ensureFile(secretsFilePath);
	ensureFile(settingsFilePath);
	ensureFile(segmentsFilePath);
	ensureFile(variablesFilePath);
}

ipcMain.handle("getPaths", async () => {
	return {
		userFolder,
		secretsFilePath,
		settingsFilePath,
		rewardsFilePath,
		segmentsFilePath,
		variablesFilePath,
	};
})


module.exports = {
	ensureUserFolder,
	userFolder,

	secretsFilePath,
	settingsFilePath,
	rewardsFilePath,
	variablesFilePath,
}