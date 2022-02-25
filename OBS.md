# OBS

## Websocket Setup

* CastMate relies on the [OBS Websocket Plugin](https://github.com/obsproject/obs-websocket/releases/tag/4.9.1) [^1] Install this OBS plugin.



* Go to the Tools -> WebSockets Server Settings ![Tools -> Websockets Server Settings](docs/images/websocketSettings.png?raw=true)

* Inside this dialog, note the port and set a password. ![Websockets Server Settings Dialog](docs/images/websocket.png?raw=true)

* In CastMate, under the Plugins fold on the left. Select OBS. From there set the Host Name to `127.0.0.1`, the port to match the dialog in OBS, and after hitting `Show Secrets` enter the password you chose in the OBS dialog. ![CastMate OBS Settings](docs/images/castmate-obs.png?raw=true) 

## Browser Sources

Until the browser overlay update, adding alerts and emotes to the overlay is a somewhat esoteric process. In future updates this will get easier!

### Emotes

This source lets emotes and emojis used by chatters to bounce around the screen.
![CastMate Bouncing Emotes](docs/images/bouncing-emotes.png?raw=true) 

Add a new `Browser Source` in OBS and change it's url to be `http://localhost/emotes.html`[^2] and set the Width and Height to be the same as your canvas. ![CastMate Bouncing Emotes](docs/images/emote-source.png?raw=true) 

### Alerts

This source shows an alert when the alert action is used by an automation. In the upcoming overlay update, these will be customizable just like alerts in some other softwares and services.

![CastMate Alert](docs/images/shot.gif?raw=true) 


Add a new `Browser Source` in OBS and change it's url to be `http://localhost/notifications.html`[^2] and set the Width and Height to be the same as your canvas. ![CastMate Bouncing Emotes](docs/images/notif-source.png?raw=true) 



[^1]: We're using 4.9.1, but will support 5.x ASAP.
[^2]: If you've changed the port in CastMate's settings you'll need to use `http://localhost:<port>/` as the base address.


