import { defineAsyncComponent } from "vue";


export default function loadWidget(name) {
    return defineAsyncComponent(() => import (`./components/${name}.vue`))
}

