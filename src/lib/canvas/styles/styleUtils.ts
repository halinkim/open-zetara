/**
 * Style Utilities for Canvas Shapes
 * Maps style prop values to actual CSS values
 */

import type { StyleProps } from '../shapes/types'

// Color palette mapping (inspired by tldraw)
const colorPalette: Record<string, string> = {
    black: '#1d1d1d',
    red: '#e03131',
    green: '#099268',
    blue: '#4465e9',
    yellow: '#f08c00',
    orange: '#e16919',
    violet: '#ae3ec9',
    grey: '#9fa8b2',
    white: '#ffffff',
}

// Size to stroke width mapping
const sizeToStrokeWidth: Record<string, number> = {
    s: 2,
    m: 4,
    l: 6,
    xl: 8,
}

// Size to font size mapping
const sizeToFontSize: Record<string, number> = {
    s: 14,
    m: 18,
    l: 24,
    xl: 32,
}

/**
 * Get CSS color value from color style prop
 */
export function getColorValue(color?: string): string {
    if (!color) return colorPalette.black
    // If it's already a hex color, return it
    if (color.startsWith('#')) return color
    // Otherwise look up in palette
    return colorPalette[color] || colorPalette.black
}

/**
 * Get stroke width from size style prop
 */
export function getStrokeWidth(size?: string): number {
    if (!size) return sizeToStrokeWidth.m
    return sizeToStrokeWidth[size] || sizeToStrokeWidth.m
}

/**
 * Get font size from size style prop
 */
export function getFontSize(size?: string): number {
    if (!size) return sizeToFontSize.m
    return sizeToFontSize[size] || sizeToFontSize.m
}

/**
 * Get fill color based on fill style and base color
 */
export function getFillValue(color?: string, fill?: string): string {
    const baseColor = getColorValue(color)

    if (!fill || fill === 'none') {
        return 'transparent'
    }

    if (fill === 'solid') {
        return baseColor
    }

    if (fill === 'semi') {
        // Return semi-transparent version
        return baseColor + '40' // 25% opacity
    }

    return 'transparent'
}

/**
 * Get stroke dash array from dash style
 */
export function getDashArray(dash?: string, strokeWidth: number = 2): string | undefined {
    if (!dash || dash === 'solid' || dash === 'draw') {
        return undefined
    }

    if (dash === 'dashed') {
        return `${strokeWidth * 3},${strokeWidth * 2}`
    }

    if (dash === 'dotted') {
        return `${strokeWidth},${strokeWidth}`
    }

    return undefined
}
