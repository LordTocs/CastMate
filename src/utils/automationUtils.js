import fs from 'fs';
import { nanoid } from 'nanoid/non-secure';
import YAML from 'yaml';

export async function loadAutomation(filePath)
{
    let fileData = await fs.promises.readFile(filePath, "utf-8");

    const automation = YAML.parse(fileData);
    
    //Filter nulls because we wound up with one and that was scary.
    if (automation.actions) {
      automation.actions = automation.actions.filter(a => a != null);
    }

    for (let action of automation.actions)
    {
        action.id = nanoid();
    }

    return automation;
}

export async function saveAutomation(filePath, automation)
{
    for (let action of automation.actions)
    {
        delete action.id;
    }

    await fs.promises.writeFile(
        filePath,
        YAML.stringify(automation)
      );
}