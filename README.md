# CastMate

CastMate is a broadcaster tool that allows Twitch viewers to interact with a broadcasters stream components through Channel Point rewards. 

**Viewer Abilities:**
 - Change OBS scenes (trigger cat cam).
 - Change Philips Hue lights (disco time!!!).
 - Play sound files ("Never Gonna Give You Up...").
 - Read text-to-speech ("wololooooo").
 - Trigger keyboard and mouse inputs (throw a grenade, jump out of a moving vehicle, drop weapon, etc.).
 - Interact with customizable OBS overlays (change score, fill the screen with emotes, etc.).
 - Execute Minecraft commands (spawn sheep with a viewer's name).
 
**Broadcaster Abilities**
- Create scenes that dynamically activate/deactivate channel rewards (activate Minecraft related rewards when your "Minecraft In-Game Scene" is activated, turn off in-game related rewards when your "Age of Empires Lobby" scene is activated, etc.).
- Create custom profiles with the CastMate UI that link with your OBS scenes. Unique triggers can be created within each profile such as channel rewards, chat commands, follow/sub events, Hue commands, etc. You can also create global triggers that are available in all of your profiles. 
- Toggle CastMate global features on and off through the "CastMate Dashboard" (mute sounds, turn off light commands, etc.).
- Create chat commands that trigger events (play a sound file, change lights, etc.).
- Create Twitch Sub, VIP, or Moderator only commands (moderator can change your scene when you forget!).
 - Create overlays with counters, goals, notifications, random wheel, and emotes.

 **Optional Plugins**
 - Age of Empires 3 (leaderboard stats, unit stats)
 - CSGO (game state stats)
 - Minecraft (execute minecraft commands dynamically)

## Installation

TBD 
  
## CastMate Setup

1. Register a new Twitch application [Here](https://dev.twitch.tv/console/apps/create).

2. Forward port 80 (or port of your choosing) in your router to the machine running this code. Reference [https://portforward.com/](https://portforward.com/) or this [YouTube Guide](https://www.youtube.com/watch?v=NTLDsEuQlYc&ab_channel=TheBreakdown) for help.

3. Edit 'user/settings.yaml' and insert your botName(optional), channelName, port,  defaultGroup (Philips Hue room name), port (OBS...leave as is or select valid port of choosing). 

4. Start CastMate

## Twitch Setup
TBD

Update secrets.yaml.

## OBS Scene Setup

Demo profiles have been created to get started with CastMate. Create the following scenes in OBS to use these profiles. Scene names will need to match exactly to use the demo profiles. You can also edit these profiles through the UI.

Game | Scene Name| 
|----|--------------------|
| Apex Legends | Gaming Apex |  
| Star Wars Battlefront 2 | Gaming BF2 |
| N/A | Cookie Wheel |
| Grand Theft Auto V | Gaming GTA |
| Minecraft | Gaming Minecraft |
| Age of Empires 3: DE | Gaming AOE3|
| Age of Empires 3: DE | Lobby AoE3|

*Events are fully customizable via the CastMate UI.*
*Once setup, change between scenes and your channel rewards will update to match each profile (with the exception of designated globabl channel rewards).*

## OBS Overlay Setup

Add the below browser sources to each scene. For easier setup, create one scene containing the browser sources you want and reference that 'Overlay' scene in each scene from above.

Feature| Browser Source URL | Example Size |Configuration
|---------|-----------------|--------------|-------------|
| Bouncing Emotes | http://127.0.0.1:80/emotes.html | 1920x1080 | N/A |
| Notifications | http://localhost:80/notifications.html | 650x350 | N/A |
| Sub Goal | http://127.0.0.1/goal.html?variable=subscribers&goal=100&title=Sub%20Goal | 800x600 | Update the 'goal' and 'title' variables in the URL to your liking | 

Leave 'Custom CSS' as is. You do not need to check any of the boxes.

*If browser sources are not working, you can select the source and click 'refresh' in OBS. Ideally, start CastMate before launching OBS and all of the browser sources will be ready to go!*

## Phillips Hue Setup
Start CastMate and press the link button on your Hue bridge when prompted.

## Additional Documentation

*  [Twitch Authentication](https://dev.twitch.tv/docs/authentication)

*  [Twitch API](https://dev.twitch.tv/docs/api/)

*  [Philips Hue](https://developers.meethue.com/develop/get-started-2/)

## Contributing

Pull requests are welcome!

## Support
*  [LordTocs' Twitch](https://www.twitch.tv/lordtocs)

*  [FitzBro's Twitch](https://www.twitch.tv/fitzbro)

*  [FitzBro's Twitter](https://twitter.com/fitzbro_gaming)