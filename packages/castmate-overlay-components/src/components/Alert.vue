<template>
    <transition name="fade">
        <div class="alert" :style="{ borderColor: color || 'transparent' }" v-if="showing">
            <div class="alert-head">
                {{ header }}
            </div>
            <div class="alert-body">
                {{ message }}
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    data() {
        return {
            message: null,
            header: null,
            color: null,
            showing: false,
        }
    },
    widget: {
        name: "Alert Box",
        description: "An ALERT!",
        icon: "mdi-square",
        testActions: ['alerts.alert']
    },
    methods: {
        showAlert(header, message, color, duration) {
            this.header = header
            this.message = message
            this.color = color
            this.showing = true

            setTimeout(() => {
                this.showing = false;
            }, duration * 1000);
        }
    }
}
</script>

<style scoped>
.alert {
    width: 100%;
    height: 100%;
    border: solid 1px black;
    background-color: grey;
    color: white;
}

.alert-head {
    font-size: 40px;
    text-align: center;
}

.alert-body {
    font-size: 30px;
    text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>