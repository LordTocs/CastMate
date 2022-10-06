# OBS Setup

1. Install the [OBS Websocket Plugin](https://github.com/obsproject/obs-websocket/releases/tag/4.9.1) [^1], which is required by CastMate in order to communicate with OBS.

2. Inside OBS, go to Tools -> WebSockets Server Settings.

    ![Tools -> Websockets Server Settings](docs/images/websocketSettings.png?raw=true)

3. Write down the port number from the OBS WebSockets Server Settings dialog and set the password.

    ![Websockets Server Settings Dialog](docs/images/websocket.png?raw=true)

4. Open CastMate and navigate to Menu (☰) -> Plugins -> OBS.

    1. Change "Host Name" to `localhost`. If CastMate will be controlling an OBS installation on a different computer, enter the IP address of the computer instead.

    2. Change "Server Port" to match the setting inside the OBS WebSocket Server Settings (default: 4444).

    3. Click "Show Secrets" and enter the password.

    4. Click the "Save" button.

    ![CastMate OBS Settings](docs/images/castmate-obs.png?raw=true)

## Browser Sources

_Note: a future version will improve the process for adding alerts and emotes to an overlay. Until then, the process is somewhat esoteric._

### Emotes

This source lets emotes and emojis used by chatters to bounce around the screen.

![CastMate Bouncing Emotes](docs/images/bouncing-emotes.png?raw=true)

First, add a new Browser Source in OBS. Set the URL to `http://localhost/emotes.html`[^2]. Finally, change the Width and Height to match your canvas size.

![CastMate Bouncing Emotes](docs/images/emote-source.png?raw=true)

### Alerts

This source shows an alert when the alert action is used by an automation. In the upcoming overlay update, these will be customizable just like alerts in some other softwares and services.

![CastMate Alert](docs/images/Shot.gif?raw=true)

Add a new `Browser Source` in OBS and change its URL to `http://localhost/notifications.html`[^2]. Set the Width and Height to match your canvas.
![CastMate Bouncing Emotes](docs/images/notif-source.png?raw=true)

[^1]: We're using 4.9.1, but will support 5.x ASAP.
[^2]: If you've changed the port in CastMate's settings you'll need to use `http://localhost:<port>/` as the base address.
