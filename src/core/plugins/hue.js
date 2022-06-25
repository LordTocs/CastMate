const nodeHueApi = require("node-hue-api");

class HUEStateTracker {
  constructor() {
    this.lastState = {};
  }

  getGroupColorState(group, requestedState) {
    let state = new lightstates.GroupLightState();
    if (!this.lastState[group]) {
      this.lastState[group] = {};
    }
    const lastState = this.lastState[group];

    if (requestedState.bri != undefined) {
      if (lastState.bri != requestedState.bri) {
        state.bri(requestedState.bri);
        lastState.bri = requestedState.bri;
      }
    }
    if (requestedState.sat != undefined) {
      if (lastState.sat != requestedState.sat) {
        state.sat(requestedState.sat);
        lastState.sat = requestedState.sat;
      }
    }
    if (requestedState.hue != undefined) {
      if (lastState.hue != requestedState.hue) {
        state.hue(requestedState.hue);
        lastState.hue = requestedState.hue;
        delete lastState.ct;
      }
    }
    if (requestedState.ct != undefined) {
      if (lastState.temp != requestedState.ct) {
        state.ct(requestedState.ct);
        lastState.ct = requestedState.ct;
        delete lastState.hue;
        delete lastState.sat;
      }
    }
    if (requestedState.on != undefined) {
      if (lastState.on != requestedState.on) {
        state.on(requestedState.on);
        lastState.on = requestedState.on;
        if (!requestedState.on) {
          this.lastState[group] = {};
        }
      }
    }
    if (requestedState.transition != undefined) {
      state.transitionInMillis(requestedState.transition);
    }
    return state;
  }

  clearGroupState(group) {
    this.lastState[group] = {};
  }
}

//node-hue-api is dumb and rate limits setGroupState()
//Rate limiting isn't flat for hue bridges,
// the less individual state parameter changes you send the more total state updates you can send.
// Since node-hue-api doesn't let you disable the rate limiter We create a fake endpoint similar to those in
// https://github.com/peter-murray/node-hue-api/blob/82b24674dbf2bc74cf1776af15344de81d10696a/lib/api/http/endpoints/endpoint.js
// and https://github.com/peter-murray/node-hue-api/blob/82b24674dbf2bc74cf1776af15344de81d10696a/lib/api/http/endpoints/groups.js
// We then execute this endpoint instead.
const fakeSetGroupStateEndpoint = {
  getRequest(parameters) {
    let data = {
      method: "PUT",
      json: true,
    };

    data.url = `/${parameters.username}/groups/${parameters.id}/action`;

    data.data = parameters.state.getPayload();

    data.headers = {
      "Content-Type": "application/json",
    };

    return data;
  },
  getErrorHandler() {
    return (err) => {
      console.error(err);
    };
  },
  getPostProcessing() {
    return null;
  },
  successCode: 200,
};

const discovery = nodeHueApi.discovery;
const hueApi = nodeHueApi.v3.api;
const lightstates = nodeHueApi.v3.lightStates;
const { evalTemplate } = require("../utils/template");

const os = require("os");
const { sleep } = require("../utils/sleep.js");
const fs = require("fs");
const path = require("path");
const { userFolder } = require("../utils/configuration");
const axios = require("axios");
const _cloneDeep = require("lodash/cloneDeep");
const { request } = require("websocket");

module.exports = {
  name: "hue",
  uiName: "HUE Lights",
  icon: "mdi-lightbulb-on-outline",
  color: "#7F743F",
  async init() {
    this.groupCache = {};
    this.stateTracker = new HUEStateTracker();

    this.stateResetter = setInterval(() => {
      this.stateTracker.lastState = {};
    }, 60000);

    if (!(await this.discoverBridge())) {
      return false;
    }

    if (!(await this.loadKey())) {
      return false;
    }

    if (!(await this.initApi())) {
      return false;
    }

    return true;
  },
  ipcMethods: {
    async getHubStatus() {
      return !!this.hue;
    },
    async searchForHub() {
      return await this.forceAuth();
    },
  },
  methods: {
    async forceAuth() {
      this.hue = null;

      if (!(await this.discoverBridge())) {
        return false;
      }

      if (!(await this.createUser())) {
        console.error("Unable to create new hue user. Abandoning");
        return false;
      }

      if (!(await this.initApi())) {
        return false;
      }

      return true;
    },
    async discoverBridge() {
      const resp = await axios.get("https://discovery.meethue.com/");
      const results = resp.data;

      if (results.length == 0) {
        console.error("Couldn't find hue bridge");
        return false;
      } else {
        this.bridgeIp = results[0].internalipaddress;
        return true;
      }
    },
    async loadKey() {
      try {
        this.hueUser = JSON.parse(
          fs.readFileSync(path.join(userFolder, "secrets/hue.json"), "utf-8")
        );
        return true;
      } catch (err) {
        return false;
      }
    },
    async createUser() {
      //Connect to hue bridge (unauthenticated)
      let unauthenticatedApi = null;
      try {
        unauthenticatedApi = await hueApi.createLocal(this.bridgeIp).connect();
      } catch (err) {
        console.error("Unable to connect to bridge to create user");
        return false;
      }

      //Try to create user 5 times to allow for hue bridge button to be pressed.
      const retries = 5;
      for (let i = 0; i < retries; ++i) {
        try {
          let user = await unauthenticatedApi.users.createUser(
            "CastMate",
            os.userInfo().username
          );

          this.hueUser = {
            username: user.username,
            clientKey: user.clientKey,
          };

          fs.writeFileSync(
            path.join(userFolder, "secrets/hue.json"),
            JSON.stringify(this.hueUser)
          );

          return true;
        } catch (err) {
          this.logger.error(
            "The link button on the bridge was not pressed. Press and try again."
          );
        }

        if (i != retries - 1) {
          this.logger.info("Trying again in 5 seconds...");
          await sleep(5000);
        }
      }

      return false;
    },
    async initApi() {
      try {
        this.hue = await hueApi
          .createLocal(this.bridgeIp)
          .connect(this.hueUser.username);
        this.analytics.set({ usesHue: true });
        return true;
      } catch (err) {
        console.error("Unable to connect with user to bridge. Abandoning");
        return false;
      }
    },
    async handleTemplateNumber(value, context) {
      if (typeof value === "string" || value instanceof String) {
        return await evalTemplate(value, context);
      }
      return value;
    },
    async getGroupNames() {
      try {
        return (await this.hue.groups.getAll()).map((g) => g.name);
      } catch (err) {
        console.error(err);
        this.logger.error(err);
        return [];
      }
    },
    async getSceneNames() {
      try {
        return (await this.hue.scenes.getAll()).map((s) => s.name);
      } catch (err) {
        this.logger.error(err);
        console.error(err);
        return [];
      }
    },
    async getGroupByName(name) {
      if (this.groupCache[name]) {
        return this.groupCache[name];
      }

      let groups = await this.hue.groups.getGroupByName(name);

      if (groups.length == 0) return;

      this.groupCache[name] = groups[0];

      return groups[0];
    },
  },
  settings: {
    defaultGroup: {
      type: String,
      name: "Default HUE Group",
      async enum() {
        return await this.getGroupNames();
      },
    },
  },
  secrets: {},
  actions: {
    color: {
      name: "Hue Light",
      description: "Changes HUE lights.",
      icon: "mdi-lightbulb-on-outline",
      color: "#7F743F",
      data: {
        type: Object,
        properties: {
          on: {
            type: Boolean,
            name: "Light Switch",
            required: true,
            default: true,
			trueIcon: "mdi-lightbulb-on",
			falseIcon: "mdi-lightbulb-outline"
          },
          hsbk: {
            type: "LightColor",
            name: "Color",
            tempRange: [2000, 6500],
            required: true,
          },
          transition: {
            type: Number,
            template: true,
            name: "Transition Time",
            required: true,
            default: 0.5,
            unit: { name: "Seconds", short: "s" },
          },
          group: {
            type: String,
            template: true,
            name: "HUE Light Group",
            async enum() {
              return await this.getGroupNames();
            },
          },
        },
      },
      async handler(lightData, context) {
        lightData = _cloneDeep(lightData);

        let groupName = lightData.group || this.settings.defaultGroup;

        const requestedState = {};

        if ("on" in lightData) {
          lightData.on = await this.handleTemplateNumber(lightData.on, context);

          requestedState.on = !!lightData.on;
        }

        if ("hsbk" in lightData) {
          const mode = lightData.hsbk.mode || "color";

          if (
            "bri" in lightData.hsbk &&
            (mode == "color" || mode == "template")
          ) {
            lightData.hsbk.bri = await this.handleTemplateNumber(
              lightData.hsbk.bri,
              context
            );

            requestedState.bri = (lightData.hsbk.bri / 100) * 254;
          }
          if (
            "sat" in lightData.hsbk &&
            (mode == "color" || mode == "template")
          ) {
            lightData.hsbk.sat = await this.handleTemplateNumber(
              lightData.hsbk.sat,
              context
            );

            requestedState.sat = (lightData.hsbk.sat / 100) * 254;
          }
          if (
            "hue" in lightData.hsbk &&
            (mode == "color" || mode == "template")
          ) {
            lightData.hsbk.hue = await this.handleTemplateNumber(
              lightData.hsbk.hue,
              context
            );

            //Hue is 0-360
            requestedState.hue = Math.floor((lightData.hsbk.hue / 360) * 65535);
          }
          if (
            "temp" in lightData.hsbk &&
            (mode == "temp" || mode == "template")
          ) {
            lightData.hsbk.temp = await this.handleTemplateNumber(
              lightData.hsbk.temp,
              context
            );

            //Convert kelvin to mired. https://en.wikipedia.org/wiki/Mired
            requestedState.ct = 1000000 / lightData.hsbk.temp;
          }
        }

        this.logger.info(`Hue Lights: ${JSON.stringify(lightData)}`);

        if ("transition" in lightData) {
          lightData.transition = await this.handleTemplateNumber(
            lightData.transition,
            context
          );

          requestedState.transition = lightData.transition * 1000;
        }

        let state = this.stateTracker.getGroupColorState(
          groupName,
          requestedState
        );

        let group = await this.hue.groups.getGroupByName(groupName); //await this.getGroupByName(groupName)

        if (group.length == 0) return;

        //await this.hue.groups.setGroupState(group[0].id, state);
        //Run our fake endpoint instead of the library's
        await this.hue.groups.execute(fakeSetGroupStateEndpoint, {
          id: group[0].id,
          state: state,
        });
      },
    },
    scene: {
      name: "Hue Scene",
      description: "Changes HUE lights to a hue scene",
      icon: "mdi-lightbulb-on-outline",
      color: "#7F743F",
      data: {
        type: Object,
        properties: {
          scene: {
            type: String,
            name: "Scene",
            async enum() {
              return await this.getSceneNames();
            },
          },
          group: {
            type: String,
            template: true,
            name: "HUE Light Group",
            async enum() {
              return await this.getGroupNames();
            },
          },
        },
      },
      async handler(sceneData) {
        let scene = sceneData.scene;
        let groupName = sceneData.group || this.settings.defaultGroup;

        this.stateTracker.clearGroupState(groupName);

        let sceneObj = await this.hue.scenes.getSceneByName(scene);

        let state = new lightstates.GroupLightState();
        state.scene(sceneObj[0].id);

        let groups = await this.hue.groups.getGroupByName(groupName);

        await Promise.all(
          groups.map((group) => this.hue.groups.setGroupState(group.id, state))
        );
      },
    },
  },
  settingsView: "hue.vue",
};
