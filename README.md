# CastMate

CastMate is an all-in-one Broadcaster Automation Suite for Twitch. It allows you to build compelling interactive stream setups using without writing any code. It features simple click and drag automations and overlays.

## Triggers

In CastMate you can setup triggers to respond to twitch events like channel point redemptions, bits being cheered, gaining a follower, receiving a sub, chat messages, being raided, hype trains, and more. In response to a trigger you can setup any number of actions using the click and drag UI.

![CastMate UI Automations](docs/images/automation.png?raw=true)

## Profiles

A profile is meant to organize triggers together based on context. For example, a Minecraft profile might contain a set of commands which are only available to viewers when the streamer is playing Minecraft, or a "Stream Starting" profile might only be active when a specific scene is active in OBS. Multiple profiles can be active at once.

![CastMate UI Profiles](docs/images/profile.png?raw=true)

Profiles can be activated automatically based on conditions such as the number of viewers, the currently active OBS scene, the value of a custom variable, various states within CastMate itself, and much more. Multiple conditions can be combined together using logical expressions like AND, OR, EQUAL, GREATER THAN, etc. If a channel point reward isn't used by any active profile they are automatically disabled and dissappear from view.

![CastMate UI Profiles](docs/images/ChannelPointRewards.gif?raw=true)

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

## Overlays

CastMate has a WYSIWYG interface for creating overlays. Create custom alerts entirely though the UI. Sync labels with CastMate's internal state automatically. Easily edit your overlays right in the UI and have their results appear immediately once saved in OBS.

![CastMate UI Profiles](docs/images/WYSIWYG.gif?raw=true)

## SpellCast

SpellCast is a companion twitch extension to CastMate that lets you do away with your "bits menu". SpellCast lets you create custom spells your viewers can cast for bits to trigger CastMate. They are activated and deactivated with your profiles just like channel point rewards. This way it's always clear to your viewers what bits will do on your stream.

![CastMate UI Profiles](docs/images/SpellCast.png?raw=true)

## Contributing

Pull Requests are on hold until a CLA can be worked out.

## Support

Feedback and bug reports are greatly appreciated! Please don't hesitate to reach out through Twitch, Discord, or GitHub issues.

-   [LordTocs' Twitch](https://www.twitch.tv/lordtocs)
-   [LordTocs' YouTube](https://www.youtube.com/channel/UCe4uXUoF5MkKvhgy514FCuA)
-   [LordTocs' Discord](https://discord.gg/txt4DUzYJM)
