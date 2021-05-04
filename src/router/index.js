import Vue from 'vue'
import VueRouter from 'vue-router'
import Profiles from "../views/Profiles.vue";
import ProfileEditor from "../views/ProfileEditor.vue";
import TriggersEditor from "../views/TriggersEditor.vue";
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
		path: "/triggers/:triggers",
		name: "Trigger Editor",
		component: TriggersEditor
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
