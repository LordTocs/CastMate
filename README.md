# CastMate

CastMate is a broadcaster tool that allows Twitch viewers to interact with a broadcasters stream components through Channel Point rewards. 

**Viewer Abilities:**
 - Change OBS scenes (trigger cat cam).
 - Change Philips Hue lights (disco time!!!).
 - Play sound files ("Never Gonna Give You Up...").
 - Read text-to-speech ("wololooooo").
 - Trigger keyboard and mouse inputs (throw a grenade, jump out of a moving vehicle, drop weapon, etc.).
 - Interact with customizable OBS overlays (change score, fill the screen with emotes, etc.).
 - Execute Minecraft commands (spawn sheep with a viewer's name...not included in demo profile).
 
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
 - Minecraft (execute Minecraft commands dynamically...not included in demo profile)

## Download
Download from GitHub releases: https://www.github.com/LordTocs/CastMate/releases
  
## CastMate Setup

1. Register a new Twitch application [Here](https://dev.twitch.tv/console/apps/create). Use this redirect URL: http://localhost/auth/channel/redirect

2. Forward port 80 (or port of your choosing) in your router to the machine running this code. Reference [https://portforward.com/](https://portforward.com/) or this [YouTube Guide](https://www.youtube.com/watch?v=NTLDsEuQlYc&ab_channel=TheBreakdown) for help.

3. Start CastMate

4. In the CastMate UI, navigate to "Plugins" > "twitch" > and click on "Show Secrets". Enter your apiClientID from step #1 and click "Save". 

5. Click "Authenticate With Channel" and sign in with your Twitch credentials. Next, click "Authenticate With Bot". You can login with the same account, or create a seperate bot Twitch account...it's up to you!

6. To configure Hue lights (optional) in the CastMate UI, navigate to "Plugins" > "lights" > click "Search for HUE Hub" > press pairing button on your Phillips Hue Hub. Enter the name of the room from your HUE app that you'd like to change the lights of in the "defaultGroup" under Settings and click "Save"

7. Download the OBS Websocket plugin: https://github.com/Palakis/obs-websocket/releases. In the topbar of OBS, navigate to "Tools" > "Websockets Server Settings". If you want to enable an OBS auth password, enter a password in OBS and in the CastMate UI, navigate to "Plugins" > "obs" > Click 'Show Secrets' and enter your password, then click "Save". If you do not want to use a password, you will need to disable auth in the OBS WebSockets Server Settings.

## OBS Scene Setup

Demo profiles have been created to get started with CastMate. Create the following scenes in OBS to use these profiles. Scene names will need to match exactly to use the demo profiles. You can also edit these profiles through the UI.

Game/Activity | Scene Name| 
|----|--------------------|
| Apex Legends | Gaming Apex |  
| Star Wars Fallen Order | Gaming Fallen Order |
| Grand Theft Auto V | Gaming GTA |
| Age of Empires 3: DE | Gaming AOE3|
| Age of Empires 3: DE | Lobby AoE3|
| AOE Civilization Wheel | Civ Wheel |

*Events are fully customizable via the CastMate UI.*
*Once setup, change between scenes and your channel rewards will update to match each profile (with the exception of designated globabl channel rewards).*

## OBS Overlay Setup

Add the below browser sources to each scene. For easier setup, create one scene containing the browser sources you want and reference that 'Overlay' scene in each scene from above.

Feature| Browser Source URL | Example Size |Configuration
|---------|-----------------|--------------|-------------|
| Bouncing Emotes | http://127.0.0.1:80/emotes.html | 1920x1080 | N/A |
| Notifications | http://localhost:80/notifications.html | 650x350 | N/A |
| Sub Goal | http://127.0.0.1/goal.html?variable=subscribers&goal=100&title=Sub%20Goal | 800x600 | Update the 'goal' and 'title' variables in the URL to your liking | 
| Civ Wheel | http://127.0.0.1:80/wheel.html?name=civs&items=civs | 800 x 600 | N/A |

Leave 'Custom CSS' as is. You do not need to check any of the boxes.

*After everything is setup, switch between your scenes a few times. CastMate will create your new channel rewards on Twitch and update them when you change scenes. 

*If browser sources are not working, you can select the source and click 'refresh' in OBS. Ideally, start CastMate before launching OBS and all of the browser sources will be ready to go!*

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
