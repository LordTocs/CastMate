<template>
	<div class="spell" v-if="spell" :style="{ backgroundColor: spell.state.spellData?.color ?? '#719ece' }">
		<div class="name-container">
			{{ spell.state.spellData?.name }}
		</div>
		<div class="bits-container">
			<span class="bits-bg"> {{ spell.state.spellData?.bits }} <i class="twi twi-bits"></i> </span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { SpellResourceConfig, SpellResourceState } from "castmate-plugin-spellcast-shared"
import { ResourceData } from "castmate-schema"

const props = defineProps<{
	spell: ResourceData<SpellResourceConfig, SpellResourceState> | undefined
}>()
</script>

<style scoped>
.spell {
	width: 7rem;
	height: 7rem;
	display: flex;

	border-radius: 0.5rem;
	color: white;
	font-weight: 400;

	display: flex;
	flex-direction: column;
	justify-content: center;

	text-align: center;
	white-space: normal;
}

.name-container {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.bits-container {
	background-color: rgba(0, 0, 0, 0.6);
	color: white;
	border-bottom-right-radius: 0.5rem;
	border-bottom-left-radius: 0.5rem;
	padding: 0.3rem;
}
</style>
