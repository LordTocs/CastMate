import { createRouter, createWebHashHistory } from "vue-router"
import Profiles from "../views/Profiles.vue"
import ProfileEditor from "../views/ProfileEditor.vue"

import Automations from "../views/Automations.vue"
import AutomationEditor from "../views/AutomationEditor.vue"

import Overlays from "../views/Overlays.vue"
import OverlayEditor from "../views/OverlayEditor.vue"

import Plans from "../views/Plans.vue"
import PlanEditor from "../views/PlanEditor.vue"

import Plugin from "../views/Plugin.vue"
import Rewards from "../views/Rewards.vue"
import Variables from "../views/Variables.vue"
import Landing from "../views/Landing.vue"
import About from "../views/About.vue"
import SpellCast from "../views/SpellCast.vue"

import { trackAnalytic } from "../utils/analytics"

const routes = [
	{
		path: "/",
		name: "CastMate",
		component: Landing,
	},
	{
		path: "/about",
		name: "About",
		component: About,
	},
	{
		path: "/streamplans",
		name: "Stream Plans",
		component: Plans,
	},
	{
		path: "/streamplans/:planId",
		name: "Stream Plan Editor",
		component: PlanEditor,
	},
	{
		path: "/profiles",
		name: "Profiles",
		component: Profiles,
	},

	{
		path: "/variables",
		name: "Variables",
		component: Variables,
	},
	{
		path: "/profiles/:profile",
		name: "Profile Editor",
		component: ProfileEditor,
	},
	{
		path: "/automations",
		name: "Automations",
		component: Automations,
	},
	{
		path: "/automations/:automation",
		name: "Automation Editor",
		component: AutomationEditor,
	},
	{
		path: "/overlays",
		name: "Overlays",
		component: Overlays,
	},
	{
		path: "/overlays/:overlayId",
		name: "Overlay Editor",
		component: OverlayEditor,
	},
	{
		path: "/plugins/:pluginName",
		name: "Plugin Settings",
		component: Plugin,
	},
	{
		path: "/rewards",
		name: "Channel Point Rewards",
		component: Rewards,
	},
	{
		path: "/spellcast",
		name: "SpellCast",
		component: SpellCast,
	},
]

const router = createRouter({
	history: createWebHashHistory(),
	routes,
})


router.beforeEach((to, from) => {
	trackAnalytic("accessRoute", {
		route: to.fullPath
	})
	return true
})

export default router
