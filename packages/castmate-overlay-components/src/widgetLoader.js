import path from 'path'

export default function loadWidget(name) {
    return import (`./components/${name}.vue`)
}

export function getAllWidgets() {
    return Object.keys(import.meta.glob('./components/*.vue')).map(filename => path.basename(filename, ".vue"))
}

