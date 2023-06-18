import * as chromatism from "chromatism2"

/**
 * 
 * @param {String} str 
 * @returns {Boolean}
 */
export function isHexColor(str) {
    return /^#(?:(?:[A-F0-9]{2}){3,4}|[A-F0-9]{3})$/i.test(str)
}



function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max)
}

//https://tannerhelland.com/2012/09/18/convert-temperature-rgb-algorithm-code.html
export function kelvinToRGB(kelvin) {
    const temp = kelvin / 100

    const color = { r: 0, g: 0, b: 0}

    if (temp <= 66) {
        color.r = 255
        color.g = 99.4708025861 * Math.log(temp) - 161.1195681661
    } else {
        color.r = 329.698727446 * Math.pow(temp - 60, -0.1332047592)
        color.g = 288.1221695283 * Math.pow(temp - 60, -0.0755148492)
    }

    if (temp >= 66) {
        color.b = 255
    } else if (temp <= 19) {
        color.b = 0
    } else {
        color.b =  138.5177312231 * Math.log(temp - 10) - 305.0447927307
    }

    color.r = clamp(color.r, 0, 255)
    color.g = clamp(color.g, 0, 255)
    color.b = clamp(color.b, 0, 255)
    return color
}

export function kelvinToCSS(kelvin, bri) {
    const rgb = kelvinToRGB(kelvin ?? 4000)
    const hsv = chromatism.convert(rgb).hsv

    hsv.v = bri ?? 100

    return chromatism.convert(hsv).cssrgb
}