import Vue from 'vue'
import VueRouter from 'vue-router'
import Profiles from "../views/Profiles.vue";
import ProfileEditor from "../views/ProfileEditor.vue";
import CommandEditor from "../views/CommandEditor.vue";
import CommandFileEditor from "../views/CommandFileEditor.vue";
import SequenceEditor from "../views/SequenceEditor.vue";

import Plugin from "../views/Plugin.vue";
import Rewards from "../views/Rewards.vue";
import Segments from '../views/Segments.vue';
import Variables from '../views/Variables.vue';

Vue.use(VueRouter)

const routes = [
	{
		path: '/',
		name: "Segments",
		component: Segments
	},
	{
		path: "/profiles",
		name: "Profiles",
		component: Profiles
	},
	{
		path: "/variables",
		name: "Variables",
		component: Variables,
	},
	{
		path: "/profiles/:profile",
		name: "Profile Editor",
		component: ProfileEditor
	},
	{
		path: "/profiles/:profile/:trigger/:command",
		name: "Command Editor",
		component: CommandEditor,
	},
	{
		path: "/commandFiles/:commandFile",
		name: "Command File Editor",
		component: CommandFileEditor
	},
	{
		path: "/sequences/:sequence",
		name: "Sequence Editor",
		component: SequenceEditor
	},
	{
		path: "/plugins/:pluginName",
		name: "Plugin Settings",
		component: Plugin
	},
	{
		path: "/rewards",
		name: "Channel Point Rewards",
		component: Rewards
	}
]

const router = new VueRouter({
	routes
})

export default router
