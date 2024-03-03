import axios from "axios"
import { TwitchAccount } from "castmate-plugin-twitch-main"
import { Color } from "castmate-schema"

const baseURL = "https://api.spellcast.gg/"

function apiGet<T = any>(url: string) {
	if (!TwitchAccount.channel.isAuthenticated) throw new Error("No Twitch Login")

	const token = TwitchAccount.channel.secrets.accessToken

	return axios.get<T>(url, {
		baseURL,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
}

function apiPost<T = any>(url: string, data: any) {
	if (!TwitchAccount.channel.isAuthenticated) throw new Error("No Twitch Login")

	const token = TwitchAccount.channel.secrets.accessToken

	return axios.post<T>(url, data, {
		baseURL,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
}

function apiPut<T = any>(url: string, data: any) {
	if (!TwitchAccount.channel.isAuthenticated) throw new Error("No Twitch Login")

	const token = TwitchAccount.channel.secrets.accessToken

	return axios.put<T>(url, data, {
		baseURL,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
}

function apiDel<T = any>(url: string) {
	if (!TwitchAccount.channel.isAuthenticated) throw new Error("No Twitch Login")

	const token = TwitchAccount.channel.secrets.accessToken

	return axios.delete<T>(url, {
		baseURL,
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
}

export interface SpellCastSpellData {
	name: string
	description?: string
	bits: number
	color: Color
	enabled: boolean
}

export interface SpellCastSpell extends SpellCastSpellData {
	_id: string
	streamer: string
	connected: boolean
}

export async function getSpells() {
	const spellsResp = await apiGet<SpellCastSpell[]>(`/streams/${TwitchAccount.channel.twitchId}/buttons/`)
	return spellsResp.data
}

export async function updateSpell(id: string, data: Partial<SpellCastSpellData>) {
	const updateResp = await apiPut<SpellCastSpell>(`/streams/${TwitchAccount.channel.twitchId}/buttons/${id}`, data)
	return updateResp.data
}

export async function deleteSpell(id: string) {
	await apiDel(`/streams/${TwitchAccount.channel.twitchId}/buttons/${id}`)
}

export async function createSpell(data: SpellCastSpellData) {
	const createResp = await apiPost<SpellCastSpell>(`/streams/${TwitchAccount.channel.twitchId}/buttons`, data)
	return createResp.data
}
