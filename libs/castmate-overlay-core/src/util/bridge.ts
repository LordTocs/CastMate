import EventEmitter from "events"
import { WebSocket } from "ws"
import { defineStore } from "pinia"
import {
	ComputedRef,
	MaybeRefOrGetter,
	computed,
	inject,
	onBeforeUnmount,
	onMounted,
	ref,
	toValue,
	watch,
	watchEffect,
} from "vue"
import { OverlayConfig, OverlayWidgetConfig } from "castmate-plugin-overlays-shared"
