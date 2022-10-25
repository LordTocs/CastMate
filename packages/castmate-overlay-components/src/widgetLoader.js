export default function loadWidget(name) {
    return import (`./components/${name}.vue`)
}

