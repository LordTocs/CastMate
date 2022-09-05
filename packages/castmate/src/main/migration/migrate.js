import fs from 'fs'
import YAML from 'yaml'

function getNextCommandKey(trigger, key) {
    const commandKeys = Object.keys(trigger);
    const i = commandKeys.findIndex(k => k == key);
    if (i == -1)
        return undefined;
    return commandKeys[i + 1];
}

function formatTimeString(seconds) {
    const hour = 60 * 60;
    const minute = 60;
    const result = "";
    if (seconds > hour) {
        const hours = Math.floor(seconds / hour);
        seconds = seconds % hour;
        result += hours + ":"
    }
    if (seconds > minute) {
        const minutes = Math.floor(seconds / minute);
        seconds = seconds % minute;
        result += String(minutes).padStart(2, '0') + ":"
    }
    result += String(seconds).padStart(2, '0');
}

function migrateProfile1_0to2_0(profile, changeTracker) {
    if (profile.version != "1.0" && profile.version != undefined)
        return profile;

    changeTracker.changed = true;

    const newProfile = {
        version: "2.0",
        triggers: {},
        conditions: profile.conditions,
        onActivate: profile.onActivate,
        onDeactivate: profile.onDeactivate,
    }

    for (let pluginKey in profile.triggers) {
        newProfile.triggers[pluginKey] = {};
        for (let triggerKey in profile.triggers[pluginKey]) {

            let newTriggerKey = triggerKey;
            if (triggerKey == 'timers') {
                newTriggerKey = 'timer';
            }
            if (triggerKey == 'kofiDonation') {
                newTriggerKey = 'donation';
            }
            if (triggerKey == 'modchat' || triggerKey == 'subchat' || triggerKey == 'vipchat') {
                newTriggerKey = 'chat';
            }

            if (!newProfile.triggers[pluginKey][newTriggerKey]) {
                newProfile.triggers[pluginKey][newTriggerKey] = [];
            }

            if (triggerKey != "follow" && triggerKey != 'firstTimeChat') {
                for (let commandKey in profile.triggers[pluginKey][triggerKey]) {
                    const command = profile.triggers[pluginKey][triggerKey][commandKey];

                    const newCommand = {
                        config: {},
                        automation: command.automation
                    }

                    //Migrate configs
                    if (triggerKey == 'chat') {
                        newCommand.config = {
                            command: commandKey,
                            match: "Start",
                            permissions: {
                                viewer: true,
                                sub: true,
                                vip: true,
                                mod: true,
                                streamer: true,
                            }
                        }
                    }
                    else if (triggerKey == 'modchat') {
                        newCommand.config = {
                            command: commandKey,
                            match: "Start",
                            permissions: {
                                viewer: false,
                                sub: false,
                                vip: false,
                                mod: true,
                                streamer: true,
                            }
                        }
                    }
                    else if (triggerKey == 'subchat') {
                        newCommand.config = {
                            command: commandKey,
                            match: "Start",
                            permissions: {
                                viewer: false,
                                sub: true,
                                vip: false,
                                mod: true,
                                streamer: true,
                            }
                        }
                    }
                    else if (triggerKey == 'vipchat') {
                        newCommand.config = {
                            command: commandKey,
                            match: "Start",
                            permissions: {
                                viewer: false,
                                sub: false,
                                vip: true,
                                mod: true,
                                streamer: true,
                            }
                        }
                    }
                    else if (triggerKey == 'redemption') {
                        newCommand.config = { reward: commandKey }
                    }
                    else if (triggerKey == 'subscribe'
                        || triggerKey == 'giftedSub'
                        || triggerKey == 'bits'
                        || triggerKey == 'raid'
                        || triggerKey == 'kofiDonation') {

                        let rangeKey = null;
                        switch (triggerKey) {
                            case 'subscribe':
                                rangeKey = 'months';
                                break;
                            case 'giftedSub':
                                rangeKey = 'subs';
                                break;
                            case 'bits':
                                rangeKey = 'bits';
                                break;
                            case 'raid':
                                rangeKey = 'raiders';
                                break;
                            case 'kofiDonation':
                                rangeKey = 'amount';
                                break;
                        }
                        const nextCommandKey = getNextCommandKey(profile.triggers[pluginKey][triggerKey], commandKey);
                        newCommand.config[rangeKey] = { min: Number(commandKey), max: nextCommandKey ? Number(nextCommandKey) : null }
                    }
                    else if (triggerKey == 'timers') {

                        const [intervalStr, offsetStr] = commandKey.split('+')

                        newCommand.config.delay = formatTimeString(offsetStr)
                        newCommand.config.interval = formatTimeString(intervalStr);
                    }

                    newProfile.triggers[pluginKey][newTriggerKey].push(newCommand);
                }
            }
            else {
                const command = profile.triggers[pluginKey][triggerKey];

                const newCommand = {
                    config: {},
                    automation: command.automation
                }

                newProfile.triggers[pluginKey][newTriggerKey].push(newCommand);
            }

            if (newProfile.triggers[pluginKey][newTriggerKey].length == 0) {
                delete newProfile.triggers[pluginKey][newTriggerKey];
                if (Object.keys(newProfile.triggers[pluginKey]).length == 0) {
                    delete newProfile.triggers[pluginKey];
                }
            }
        }
    }

    return newProfile;
}

export async function migrateProfile(profile, filename) {
    const changeTracker = { changed: false }
    profile = migrateProfile1_0to2_0(profile, changeTracker)


    if (changeTracker.changed) {
        //Save the profile
        await fs.promises.writeFile(filename, YAML.stringify(profile))
    }

    return profile;
}
