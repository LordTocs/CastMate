import Vue from 'vue'
import VueRouter from 'vue-router'
import Profiles from "../views/Profiles.vue";
import ProfileEditor from "../views/ProfileEditor.vue";
import CommandFileEditor from "../views/CommandFileEditor.vue";
import SequenceEditor from "../views/SequenceEditor.vue";
import Plugin from "../views/Plugin.vue";
import Rewards from "../views/Rewards.vue";

Vue.use(VueRouter)

const routes = [
	{
		path: "/",
		name: "Profiles",
		component: Profiles
	},
	{
		path: "/profiles/:profile",
		name: "Profile Editor",
		component: ProfileEditor
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
