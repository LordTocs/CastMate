

//BTTV List
//https://api.betterttv.net/3/cached/users/twitch/27082158
//BTTV CDN
//https://cdn.betterttv.net/emote/<emote id>/3x

//FFZ
// https://api.frankerfacez.com/v1/set/global set 0
// https://api.frankerfacez.com/v1/room/id/27082158
// https://cdn.frankerfacez.com/emote/128054/3

//7TTV List
// https://api.7tv.app/v2/users/lordtocs/emotes
// SSE https://events.7tv.app/v1/channel-emotes?channel=lordtocs
// https://cdn.7tv.app/emote/60e5cded840f3a570108cd8d/1x

import joypixels from 'emoji-toolkit'
import axios from 'axios'

let unicodeRegExp = new RegExp(joypixels.escapeRegExp(joypixels.unicodeCharRegex()), 'gi');

export class EmoteService {
    constructor() {
        this.bttvLookup = {};
        this.sevenTVLookup = {};
        this.ffzLookup = {};
        this.thirdPartyLookup = {};
    }

    async init(channelId, channelName) {
        this.channelName = channelName;
        this.channelId = channelId;

        if (channelId && channelName)
        {
            await this.initBTTV();

            await this.init7tv();

            await this.initFFZ();
        }
    }

    async updateChannelId(channelId) {
        this.channelId = channelId

        await this.initBTTV();

        await this.initFFZ();
    }

    async updateChannelName(channelName) {
        this.channelName = channelName

        await this.init7tv()
    }

    async initBTTV() {
        const queryBttv = async () => {
            const resp = await axios.get(`https://api.betterttv.net/3/cached/users/twitch/${this.channelId}`);

            const emoteLookup = {};

            const sharedEmotes = resp.data.sharedEmotes;
            const channelEmotes = resp.data.channelEmotes;

            for (let emote of [...sharedEmotes, ...channelEmotes]) {
                emoteLookup[emote.code] = `https://cdn.betterttv.net/emote/${emote.id}/3x`;
            }

            this.bttvLookup = emoteLookup;
            this.mergeLookups();
        }

        if (this.bttvReferesh) {
            clearInterval(this.bttvReferesh);
        }
        this.bttvReferesh = setInterval(queryBttv, 60000);
        await queryBttv();
    }

    async init7tv() {
        if (this.sevenEvents) {
            this.sevenEvents.close();
        }

        const resp = await axios.get(`https://api.7tv.app/v2/users/${this.channelName}/emotes`);

        const lookup = {};
        for (let emote of resp.data) {
            lookup[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/3x`;
        }

        const globalResp = await axios.get(`https://api.7tv.app/v2/emotes/global`);
        for (let emote of globalResp.data) {
            lookup[emote.name] = `https://cdn.7tv.app/emote/${emote.id}/3x`;
        }

        this.sevenTVLookup = lookup;
        this.mergeLookups();

        if (this.sevenEvents) {
            this.sevenEvents.close();
        }

        this.sevenEvents = new EventSource(`https://events.7tv.app/v1/channel-emotes?channel=${this.channelName}`);

        this.sevenEvents.addEventListener("ready", (e) => {
            // Should be "7tv-event-sub.v1" since this is the `v1` endpoint
            console.log("Ready", e.data);
        }, false);

        this.sevenEvents.addEventListener("update", (e) => {
            const data = JSON.parse(e.data);
            // This is a JSON payload matching the type for the specified event channel
            if (data.action == 'ADD') {
                this.sevenTVLookup[data.name] = `https://cdn.7tv.app/emote/${data.emote_id}/3x`;
                console.log("Added 7tv" + data.name);
                this.mergeLookups();
            }
            else if (data.action == 'REMOVE') {
                delete this.sevenTVLookup[data.name];
                console.log("Removed 7tv" + data.name);
                this.mergeLookups();
            }
        }, false);

        this.sevenEvents.addEventListener("open", (e) => {
            // Connection was opened.
            console.log("Open", e.data);
        }, false);

        this.sevenEvents.addEventListener("error", (e) => {
            if (e.readyState === EventSource.CLOSED) {
                // Connection was closed.
                console.log("7TV Error", e);
            }
        }, false);
    }

    async initFFZ() {
        const queryFFZ = async () => {
            const resp = await axios.get(`https://api.frankerfacez.com/v1/room/id/${this.channelId}`);

            const lookup = {};
            for (let setId in resp.data.sets) {
                const set = resp.data.sets[setId];
                for (let emote of set.emoticons) {
                    lookup[emote.name] = emote.urls['4'] || emote.urls['3'];
                }
            }


            const globalResp = await axios.get(`https://api.frankerfacez.com/v1/set/global`);
            for (let setId in globalResp.data.sets) {
                const set = globalResp.data.sets[setId];
                for (let emote of set.emoticons) {
                    lookup[emote.name] = emote.urls['4'] || emote.urls['3'];
                }
            }

            this.ffzLookup = lookup;
            this.mergeLookups();
        }
        await queryFFZ();

        if (this.ffzReferesh) {
            clearInterval(this.ffzReferesh);
        }
        this.ffzReferesh = setInterval(queryFFZ, 60000);
        await queryFFZ();
    }

    mergeLookups() {
        this.thirdPartyLookup = { ...this.bttvLookup, ...this.sevenTVLookup, ...this.ffzLookup };
    }

    findNextEmote(message, code, index)
    {
        while (true)
        {
            index = message.indexOf(code, index);
            if (index < 0)
                return index;
            if (index + code.length == message.length || /\s/.test(message[index + code.length]))
            {
                return index;
            }
            index += code.length;
        }
    }

    parseMessage(chat) {
        const result = [];

        //First emoji search
        let emojis = [...chat.message.matchAll(unicodeRegExp)];
        for (let e of emojis) {
            let shortName = joypixels.shortnameLookup[e];
            if (shortName) {
                let url = joypixels.defaultPathPNG + '64' + '/' + joypixels.emojiList[shortName].uc_base + joypixels.fileExtension;
                result.push(url);
            }
        }

        //Then twitch emotes
        for (let emote in chat.emoteOffsets) {
            let num = chat.emoteOffsets[emote].length;
            for (let i = 0; i < num; ++i) {
                result.push(`https://static-cdn.jtvnw.net/emoticons/v2/${emote}/default/light/3.0`);
            }
        }

        for (let code in this.thirdPartyLookup) {
            for (let index = this.findNextEmote(chat.message, code); index >= 0; index = this.findNextEmote(chat.message, code, index + code.length)) {
                result.push(this.thirdPartyLookup[code]);
            }
        }

        return result;
    }
}