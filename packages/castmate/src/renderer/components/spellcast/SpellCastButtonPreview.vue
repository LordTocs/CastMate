<template>
	<div
		v-if="spell"
		class="spell"
		:style="{ backgroundColor: spell.config.color ?? '#719ece' }"
	>
		<div class="name-container">
			{{ spell.config.name }}
		</div>
		<div class="bits-container">
			<span class="bits-bg"> {{ spell.config.bits }} <bits-icon /> </span>
		</div>
	</div>
</template>

<script setup>
import { computed } from "vue";
import { useResourceArray } from "../../utils/resources";
import BitsIcon from "../twitch/BitsIcon.vue"

const props = defineProps({
	spellId: {},
})

const spells = useResourceArray('spell')
const spell = computed(() => spells.value.find(s => s.id == props.spellId))

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
