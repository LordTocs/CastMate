import fs from "fs"
import path from "path"

export async function isFirstRun(userFolder) {
	const testPath = path.join(userFolder, "firstrun.txt")

	if (await fs.existsSync(testPath)) return false

	await fs.promises.writeFile(testPath, "not first run")
	return true
}
