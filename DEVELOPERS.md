## Setup

Pull Requests are on hold until a CLA can be worked out.

We're currently developing on node 16.13.1.

This project relies on VUE CLI you need to run `npm install -g @vue/cli`

The is repo is a mono repo and we rely on yarn to handle cross package dependencies.

Run `yarn install` after cloning the repo

CastMate has a custom vite plugin to handle mono-repo stuff

Run `yarn run setup-vite` to build the custom vite plugin.

To start in development mode, use `yarn run dev`

To build into an installer run `yarn run build`

## Useful Documentation Links

-   [OBS Websocket Protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md)

-   [Twitch Authentication](https://dev.twitch.tv/docs/authentication)

*   [Twitch API](https://dev.twitch.tv/docs/api/)

-   [Philips Hue](https://developers.meethue.com/develop/get-started-2/)

-   [Twurple Docs](https://twurple.js.org/)
