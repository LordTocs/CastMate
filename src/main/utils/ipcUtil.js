const { ipcMain } = require("electron");

let mainWindowSender = null;

function getMainWindowSender()
{
	const promise = new Promise((resolve) =>
	{
		if (!mainWindowSender)
		{
			ipcMain.on("main-window", (event) =>
			{
				console.log("Got Main Window Sender");
				mainWindowSender = event.sender;
				resolve(mainWindowSender);
			})
		}
		else
		{
			resolve(mainWindowSender);
		}
	});
	return promise;
}

module.exports = { getMainWindowSender };