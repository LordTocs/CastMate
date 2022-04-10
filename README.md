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

A profile contains a set of automations that are meant to be grouped together based on when they are needed. For example, a Minecraft profile might contain a set of triggers and automations which are only available when the streamer is playing Minecraft, or a "Stream Starting" profile might only be active when a specific scene is active in OBS. Multiple profiles can be active at once.

A profile is also where automations are mapped to the triggers that start them. A profile can contain many sets of triggers and automations which are all enabled or disabled together as a group.

Profiles are activated automatically based conditions such as the active OBS scene, the value of a variable, the number of viewers, or hundreds of other combinations of conditions.

![CastMate UI Profiles](docs/images/profile.png?raw=true)

The possibilities are endless, so here are some ideas to get you started:

-   Create a text-to-speech channel point redemption that's only available as long as the stream has less than some number of viewers.
-   A "Stream Ending" profile which automatically pastes social media links to chat when your "End Stream" scene is active in OBS.
-   Create a nearby enemy gunfire sound effect that's only available during specific games (so it can't be used during an ASMR stream, for example). Alternatively, make a jump scare sound effect cost triple during ASMR.
-   Have a song request channel redemption that's only available during a Music stream segment.
-   Create an alternate versions of a channel point redemption that costs more to redeem when the number of viewers is higher, to encourage engagement during slow streams and to reduce spam during active streams.
-   Set up a channel point redemption that is only visible when there are exactly 69 viewers, which can only be redeemed once per stream or once per viewer.

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
