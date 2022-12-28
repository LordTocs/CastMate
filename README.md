# CastMate

CastMate is a companion tool for Twitch broadcasters which allows viewers to affect various aspects of a stream:

-   Trigger [OBS](OBS.md) scene changes and overlays
-   Control smart home lighting
-   Simulate game input
-   Play sounds
-   ...and much more

Actions can be triggered through bit cheers, gifted subscriptions, twitch extensions, channel point redeems, raids, and the other usual methods.

## Core Functionality

### Automations

Actions are the building blocks of an automation. They do simple things like send a message to twitch chat, play a sound, or change the color of your HUE lights.

![CastMate UI Action](docs/images/action.png?raw=true)

Automations are used to sequence multiple actions together. For example, synchronize changes to HUE lighting, OBS filters, and play sounds all at once.

![CastMate UI Automations](docs/images/automation.png?raw=true)

### Profiles

A profile is meant to group automations and triggers together based on context. For example, a Minecraft profile might contain a set of commands which are only available to viewers when the streamer is playing Minecraft, or a "Stream Starting" profile might only be active when a specific scene is active in OBS. Multiple profiles can be active at once.

Profiles can be activated automatically based on conditions such as the number of viewers, the currently active OBS scene, the value of a custom variable, various states within CastMate itself, and much more. Multiple conditions can be combined together using logical expressions like AND, OR, EQUAL, GREATER THAN, etc.

![CastMate UI Profiles](docs/images/profile.png?raw=true)

The possibilities are endless, so here are some ideas to get you started:

-   Create alternate versions of a channel point redemption that costs more to redeem when the number of viewers is higher, to encourage engagement during slow streams and to reduce spam during active streams.
-   Allow text-to-speech with channel points, but only if the stream has less than some number of viewers.
-   A "Stream Ending" profile which automatically starts sending social media links to chat while your "End Stream" scene is active in OBS.
-   Automatically run ads whenever your "Be Right Back" scene is active.
-   Have a jump scare sound effect that automatically costs triple during specific stream segments.
-   Let viewers troll you with a command that plays different sounds based on the game, like enemy footsteps during a shooter or creepers during minecraft.
-   Make a song request channel point redemption that's only available during a Music stream segment.
-   Set up a "First" channel point redemption item that can only be claimed once per stream.
-   Set up a channel point redemption that is only visible when there are exactly 69 viewers. Nice.

## Setup

1. Download `CastMate-Setup.exe` from GitHub releases: https://www.github.com/LordTocs/CastMate/releases

2. Run the installer

3. Sign in with your twitch account, and optionally a bot account. ![CastMate Sign In](docs/images/sign-in.png?raw=true)

4. See the [OBS Setup Guide](OBS.md) to configure OBS!

## Upcoming Features

-   Downloadable Plugins - Allow additional plugins to be installed to support new actions, triggers, state, and other features!
-   OBS Websocket Plugin 5.x - With OBS 28.0.0 the websocket plugin will be bundled automatically with OBS! Reducing our setup overhead!
-   Overlay Editor - Create overlays to show custom alerts and other visual effects.
-   State Triggers - Run automations when CastMate state triggers.
-   BitButtons - Let viewers trigger automations via bits!

## Contributing

Pull Requests are on hold until a CLA can be worked out.

## Support

Feedback and bug reports are greatly appreciated! Please don't hesitate to reach out through Twitch, Discord, or GitHub issues.

-   [LordTocs' Twitch](https://www.twitch.tv/lordtocs)
-   [LordTocs' YouTube](https://www.youtube.com/channel/UCe4uXUoF5MkKvhgy514FCuA)
-   [LordTocs' Discord](https://discord.gg/txt4DUzYJM)
