import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Profiles from "../views/Profiles.vue";
import ProfileEditor from "../views/ProfileEditor.vue";
import Plugin from "../views/Plugin.vue";

Vue.use(VueRouter)

const routes = [
	{
		path: '/',
		name: 'Home',
		component: Home
	},
	{
		path: '/about',
		name: 'About',
		// route level code-splitting
		// this generates a separate chunk (about.[hash].js) for this route
		// which is lazy-loaded when the route is visited.
		component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
	},
	{
		path: "/profiles",
		name: "Profiles",
		component: Profiles
	},
	{
		path: "/profiles/:profile",
		name: "Profile Editor",
		component: ProfileEditor
	},
	{
		path: "/plugins/:pluginName",
		name: "Plugin Settings",
		component: Plugin
	}
]

const router = new VueRouter({
	routes
})

export default router
