# CastMate

CastMate is a broadcaster tool that allows Twitch viewers to interact with a broadcasters stream components through Channel Point rewards. 

**Viewers Abilities:**
 - Change OBS scenes (trigger cat cam)
 - Change Philips Hue lights (disco time!!!)
 - Play sound files ("Never Gonna Give You Up..."
 - Read text-to-speech ("wololooooo")
 - Trigger keyboard and mouse inputs (throw a grenade, jump out of a moving vehicle, drop weapon, etc.)
 - Interact with customizable OBS overlays (change score, fill the screen with emotes, etc.)
 - Execute Minecraft commands (spawn sheep with a viewer's name)
 
**Broadcaster Abilities**
- Create scenes that dynamically activate/deactivate rewards (activate Minecraft related rewards when your "Minecraft In-Game Scene" is activated, turn off in-game related rewards when your "Age of Empires Lobby" scene is activated, etc.)
- Easily turn CastMate features on and off through with the "CastMate Dashboard" 
- Create chat commands that trigger events (play a sound file, change lights, etc.)
- Create Twitch Sub, VIP, or Moderator only commands (moderator can change your scene when you forget!)
 - Create overlays with counters, goals, notifications, random wheel, and emotes

## Installation

TBD...click this link and have fun. 
  
## CastMate Setup

1. Register a new Twitch application [Here](https://dev.twitch.tv/console/apps/create).

2. Forward port 80 (or port of your choosing) in your router to the machine running this code. Reference [https://portforward.com/](https://portforward.com/) or this [YouTube Guide](https://www.youtube.com/watch?v=NTLDsEuQlYc&ab_channel=TheBreakdown) for help.

3. Edit 'user/settings.yaml' and insert your botName(optional), channelName, port,  defaultGroup (Philips Hue room name), port (OBS...leave as is or select valid port of choosing). 

4. Start CastMate

## Twitch Setup
TBD

If we run out of time, edit secrets.yaml and input 

## OBS Scene Setup

Demo profiles have been created to get started with CastMate. Create the following scenes in OBS. Scene names will need to match exactly to use the demo profiles. 

Scene Name| Browser Source URL | Notes |
|---------|--------------------|-------|
| Gaming Apex |  |
| Gaming BF2 |
| Cookie Wheel |
| Gaming GTA |
| Gaming Minecraft |
| Gaming Age of Empires 3|
| Lobby Age of Empires 3|
| 

*Events are fully customizable by editing the corresponding .yaml file that match the scene name. These customizations will be easily made available via the CastMate UI in future versions.*

## Phillips Hue Setup
Start CastMate and press the link button on your Hue bridge.

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