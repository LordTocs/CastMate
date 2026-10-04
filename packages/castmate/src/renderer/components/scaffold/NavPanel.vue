<template>
	<div class="nav-panel" ref="navBody">
		<flex-scroller class="nav-content">
			<nav-panel-section>
				<template #header>
					<img src="../../assets/castmate/logo-dark.svg" style="height: 1em; padding-left: 1rem" />CastMate
				</template>
				<template #default> WOAH </template>
			</nav-panel-section>
			<nav-panel-section>
				<template #header> Twitch </template>
				<template #default> </template>
			</nav-panel-section>
			<nav-panel-section>
				<template #header> <i class="mdi mdi-cog" /> Settings </template>
				<template #default>
					<nav-panel-item icon="mdi mdi-star"> Star! </nav-panel-item>
					<nav-panel-item icon="mdi mdi-text"> Next! </nav-panel-item>
				</template>
			</nav-panel-section>
		</flex-scroller>
		<expander-slider v-model="expandedSize" :container="navBody" direction="vertical" />
	</div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from "vue"
import { ExpanderSlider } from "castmate-ui-core"
import { FlexScroller } from "castmate-ui-core"
import NavPanelSection from "./NavPanelSection.vue"
import NavPanelItem from "./NavPanelItem.vue"

const expandedSize = ref<number>(300)
const expanded = ref(true)

const navBody = useTemplateRef("navBody")
</script>

<style scoped>
.nav-panel {
	width: v-bind("`${expandedSize}px`");
	display: flex;
	flex-direction: row;
}

.nav-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	background-color: var(--surface-b);
}
</style>
