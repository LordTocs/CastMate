<template>
	<span class="cursor"><span class="cursor-internal"></span></span>
</template>

<style scoped>
@keyframes blink {
	0% {
		border-color: #ffffff;
	}
	49% {
		border-color: #ffffff;
	}
	50% {
		border-color: rgba(0, 0, 0, 0);
	}
	99% {
		border-color: rgba(0, 0, 0, 0);
	}
}
.cursor {
	position: relative;
	display: inline-block;

	height: 1em;
}

.cursor-internal {
	position: absolute;
	height: 1.25em;
	top: 0.1em;
	border-right: solid 1px white;
	animation: blink 1s;
	animation-iteration-count: infinite;
}
</style>
