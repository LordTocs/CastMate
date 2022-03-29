# CastMate

CastMate is a broadcast tool for twitch that lets you create viewer controlled automations which can change lights, play sounds, influence OBS scenes, affect overlays, send twitch chat messages, simulate input, and more. These automations can be set to run on chat commands, stream events like raids, channel point redemptions, bits, and more. Additionally CastMate profiles can change which automations are set to run and which channel point rewards are available automatically based on just about anything including your active OBS scene and number of viewers.

![CastMate UI Picture](docs/images/hero.png?raw=true)

## Core Functionality

### Actions

Actions are the building blocks of an automation. They do simple things like send a message to twitch chat, play a sound, or change the color of your HUE lights. 

![CastMate UI Action](docs/images/action.png?raw=true)

### Automations

Automations are a list of actions that can be run by various triggers. They can be used to sequence multiple actions to happen together. Such as synchronizing lights and sounds together, controlling multiple HUE lights at once, changing OBS filters to match sounds, and more.

![CastMate UI Automations](docs/images/automation.png?raw=true)

### Profiles

Profiles are a way to set which automations are to run by which triggers. Profiles can be configured with activation conditions. When a profile's activation conditions aren't met the commands and channel point rewards inside of it won't be available. This lets the streamer create contextual commands and rewards available only during a certain part of the stream.

![CastMate UI Profiles](docs/images/profile.png?raw=true)

### Setup

1. Download the installer [here](https://www.github.com/LordTocs/CastMate/latest)

2. Run the installer

3. Sign in with your twitch account, and optionally a bot account. ![CastMate Sign In](docs/images/sign-in.png?raw=true)

4. See the [OBS Setup Guide](OBS.md) to configure OBS!

## Download

Download from GitHub releases: https://www.github.com/LordTocs/CastMate/releases

## Upcoming Features

* Downloadable Plugins - Allow additional plugins to be installed to support new actions, triggers, state, and other features!
* OBS Websocket Plugin 5.x - With OBS 28.0.0 the websocket plugin will be bundled automatically with OBS! Reducing our setup overhead!
* Overlay Editor - Create overlays to show custom alerts and other visual effects. 
* State Triggers - Run automations when CastMate state triggers.
* BitButtons - Let viewers trigger automations via bits!

## Contributing

Pull Requests are on hold until a CLA can be worked out.

## Support

- [LordTocs' Twitch](https://www.twitch.tv/lordtocs)
- [LordTocs' YouTube](https://www.youtube.com/channel/UCe4uXUoF5MkKvhgy514FCuA)


