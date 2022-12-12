// This is sort of a weird stop gap. We need a type to feed to the props {} schemas so they generate JSON Schema objects in CastMate correctly

function resolveColorRef(color, refs) {
    if (color && color.ref) {
        return refs[color.ref]
    }

    return color;
}


export class MediaFile {
    
}

export class OverlayFontStyle {

    constructor() {
        this.fontSize = 10
        this.fontColor = "#FFFFFF"
        this.fontFamily = "Arial"
        this.fontWeight = 300
        this.stroke = null; /*{
            width: 0,
            color: "#000000"
        }*/
        this.shadow = null; /*{
            offsetX: 0,
            offsetY: 0,
            blur: 0,
            color: "#FFFFFF"
        }*/
    }

    static getStyleObj(overlayFontStyle, colorRefs) {
        const result = {};

        result.fontSize = `${overlayFontStyle.fontSize}px`
        result.color = resolveColorRef(overlayFontStyle.fontColor, colorRefs)
        result.fontFamily = overlayFontStyle.fontFamily
        result.fontWeight = overlayFontStyle.fontWeight
        if (overlayFontStyle.stroke && overlayFontStyle.width > 0) {
            result['-webkit-text-stroke-color'] = resolveColorRef(overlayFontStyle.stroke.color, colorRefs) || "#000000"
            result['-webkit-text-stroke-width'] = `${overlayFontStyle.stroke.width}px`
        }
        if (overlayFontStyle.shadow) {
            result.textShadow = `${overlayFontStyle.shadow.offsetX || 0}px ${overlayFontStyle.shadow.offsetY || 0}px ${overlayFontStyle.shadow.blur || 0}px ${resolveColorRef(overlayFontStyle.shadow.color, colorRefs) || "#000000"}`
        }

        return result;
    }
}