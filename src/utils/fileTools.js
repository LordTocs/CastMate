
import { store } from '../store/store';
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import { trackAnalytic } from './analytics';
import { nanoid } from 'nanoid/non-secure';
import _ from 'lodash';

////////////////////////
////// Profiles ////////
////////////////////////

function getProfilePath(name) {
    const nameArray = name ? [`${name}.yaml`] : [];
    return path.join(store.getters['ipc/paths'].userFolder, "profiles", ...nameArray);
}

export async function getAllProfiles() {
    let profiles = await fs.promises.readdir(getProfilePath());

    profiles = profiles.filter((f) => path.extname(f) == ".yaml");

    profiles = profiles.map((f) => path.basename(f, ".yaml"));

    return profiles;
}

export async function profileExists(profileName) {
    try {
        await fs.promises.access(getProfilePath(profileName), fs.constants.F_OK);
        return true;
    }
    catch
    {
        return false;
    }
}

export async function createNewProfile(profileName) {
    let newYaml = YAML.stringify({
        version: "1.0",
        triggers: {},
        variables: {},
        rewards: [],
    });

    await fs.promises.writeFile(
        getProfilePath(profileName),
        newYaml,
        "utf-8"
    );

    trackAnalytic("newProfile", { name: profileName });
}

export async function deleteProfile(profileName) {
    if (!await profileExists(profileName)) {
        return;
    }

    await fs.promises.unlink(getProfilePath(profileName));

    trackAnalytic("deleteProfile", { name: profileName });
}

export async function renameProfile(oldName, newName) {
    const oldPath = getProfilePath(oldName);
    const newPath = getProfilePath(newName);

    if (!await profileExists(oldName))
        return false;
    if (await profileExists(newName))
        return false;

    try {
        await fs.promises.rename(oldPath, newPath);
    }
    catch
    {
        return false;
    }

    return true;
}

export async function duplicateProfile(profileName, duplicateName) {

    const profilePath = getProfilePath(profileName);
    const duplicatePath = getProfilePath(duplicateName);

    if (!await profileExists(profileName))
        return false;
    if (await profileExists(duplicateName))
        return false;


    try {
        console.log("Copying ", profileName, duplicateName);
        await fs.promises.copyFile(profilePath, duplicatePath);

        trackAnalytic("duplicateProfile", { name: profileName });
    }
    catch {
        console.log("Copy failed!");
        return false;
    }

    return true;
}

export async function saveProfile(profileName, profileData) {
    let data = _.cloneDeep(profileData);

    for (let pluginName in data.triggers) {
        for (let triggerName in data.triggers[pluginName])
        {
            const triggerArray = data.triggers[pluginName][triggerName];
            for (let trigger of triggerArray)
            {
                delete trigger.id;
                if (trigger.automation instanceof Object)
                {
                    for (let action of trigger.automation.actions)
                    {
                        delete action.id;
                    }
                }
            }
        }
    }

    let newYaml = YAML.stringify(profileData);

    await fs.promises.writeFile(
        getProfilePath(profileName),
        newYaml
    );

    trackAnalytic("saveProfile", { name: profileName });
}

export async function loadProfile(profileName) {
    const dataStr = await fs.promises.readFile(getProfilePath(profileName), "utf-8");

    const data = YAML.parse(dataStr);

    //Handle default conditions
    if (!data.conditions) {
        data.conditions = { operator: "any", operands: [] };
    }

    for (let pluginName in data.triggers) {
        for (let triggerName in data.triggers[pluginName])
        {
            const triggerArray = data.triggers[pluginName][triggerName];
            for (let trigger of triggerArray)
            {
                trigger.id = nanoid();
                if (trigger.automation instanceof Object)
                {
                    for (let action of trigger.automation.actions)
                    {
                        action.id = nanoid();
                    }
                }
            }
        }
    }

    return data;
}

///////////////////////////
////// Automations ////////
///////////////////////////


function getAutomationPath(name) {
    const nameArray = name ? [`${name}.yaml`] : [];
    return path.join(store.getters['ipc/paths'].userFolder, "automations", ...nameArray);
}

export async function getAllAutomations() {
    let automations = await fs.promises.readdir(getAutomationPath());

    automations = automations.filter((f) => path.extname(f) == ".yaml");

    automations = automations.map((f) => path.basename(f, ".yaml"));

    return automations;
}

export async function automationExists(automationName) {
    try {
        await fs.promises.access(getAutomationPath(automationName), fs.constants.F_OK);
        return true;
    }
    catch
    {
        return false;
    }
}

export function generateEmptyAutomation() {
    return {
        version: "1.0",
        description: "",
        actions: [],
    }
}

export async function createNewAutomation(automationName) {
    let newYaml = YAML.stringify(generateEmptyAutomation());

    await fs.promises.writeFile(
        getAutomationPath(automationName),
        newYaml,
        "utf-8"
    );

    trackAnalytic("newAutomation", { name: automationName });
}

export async function deleteAutomation(automationName) {
    if (!await automationExists(automationName)) {
        return;
    }

    await fs.promises.unlink(getAutomationPath(automationName));

    trackAnalytic("deleteAutomation", { name: automationName });
}

export async function renameAutomation(oldName, newName) {
    const oldPath = getAutomationPath(oldName);
    const newPath = getAutomationPath(newName);

    if (!await automationExists(oldName))
        return false;
    if (await automationExists(newName))
        return false;

    try {
        await fs.promises.rename(oldPath, newPath);
    }
    catch
    {
        return false;
    }

    return true;
}

export async function duplicateAutomation(automationName, duplicateName) {

    const automationPath = getAutomationPath(automationName);
    const duplicatePath = getAutomationPath(duplicateName);

    if (!await automationExists(automationName))
        return false;
    if (await automationExists(duplicateName))
        return false;


    try {
        await fs.promises.copyFile(automationPath, duplicatePath);
        trackAnalytic("duplicateAutomation", { name: automationName });
    }
    catch {
        return false;
    }

    return true;
}

export async function saveAutomation(automationName, automationData) {

    const newData = _.cloneDeep(automationData);

    for (let action of newData.actions) {
        delete action.id;
    }

    let newYaml = YAML.stringify(newData);

    await fs.promises.writeFile(
        getAutomationPath(automationName),
        newYaml
    );

    trackAnalytic("saveAutomation", { name: automationName });
}

export async function loadAutomation(automationName) {
    const dataStr = await fs.promises.readFile(getAutomationPath(automationName), "utf-8");

    const data = YAML.parse(dataStr);

    //Filter nulls because we wound up with one and that was scary.
    if (data.actions) {
        data.actions = data.actions.filter(a => a != null);
    }

    for (let action of data.actions) {
        action.id = nanoid();
    }

    return data;
}