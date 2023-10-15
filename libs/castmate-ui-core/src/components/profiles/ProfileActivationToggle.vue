<template>
	<toggle-switch v-model="profileToggle" toggle-icon="mdi mdi-cogs" />
</template>

<script setup lang="ts">
import { ProfileState, ProfileConfig, ResourceData } from "castmate-schema"
import { ProjectItem, ToggleSwitch, useResource, useResourceStore } from "../../main"
import { computed } from "vue"

const resource = useResource<ResourceData<ProfileConfig, ProfileState>>("Profile", () => props.item.id)

const resourceStore = useResourceStore()

const props = defineProps<{
	item: ProjectItem
}>()

const profileToggle = computed({
	get() {
		return resource.value.config.activationMode ?? "toggle"
	},
	set(v) {
		resourceStore.applyResourceConfig("Profile", props.item.id, { activationMode: v })
	},
})
</script>
