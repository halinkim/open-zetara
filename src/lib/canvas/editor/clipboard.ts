/**
 * Clipboard utilities for canvas shapes
 * Provides copy/paste functionality with fallback to localStorage
 */

import { Shape } from '../shapes/types'

export interface ClipboardData {
    type: 'canvas-shapes'
    version: 1
    shapes: Shape[]
    timestamp: number
}

/**
 * Copy shapes to clipboard
 */
export async function copyShapesToClipboard(shapes: Shape[]): Promise<void> {
    const data: ClipboardData = {
        type: 'canvas-shapes',
        version: 1,
        shapes: shapes.map(s => structuredClone(s)),
        timestamp: Date.now()
    }

    const jsonString = JSON.stringify(data)

    try {
        // Try modern clipboard API
        await navigator.clipboard.writeText(jsonString)
    } catch (err) {
        console.warn('Failed to write to clipboard, using localStorage fallback', err)
        // Fallback to localStorage
        localStorage.setItem('canvas-clipboard', jsonString)
    }
}

/**
 * Paste shapes from clipboard
 */
export async function pasteShapesFromClipboard(): Promise<Shape[] | null> {
    try {
        // Try modern clipboard API
        const text = await navigator.clipboard.readText()
        const data = JSON.parse(text) as ClipboardData

        if (data.type === 'canvas-shapes' && data.version === 1) {
            return data.shapes.map(s => structuredClone(s))
        }
    } catch (err) {
        // Try localStorage fallback
        const stored = localStorage.getItem('canvas-clipboard')
        if (stored) {
            try {
                const data = JSON.parse(stored) as ClipboardData
                if (data.type === 'canvas-shapes' && data.version === 1) {
                    return data.shapes.map(s => structuredClone(s))
                }
            } catch (parseErr) {
                console.warn('Failed to parse clipboard data from localStorage', parseErr)
            }
        }
    }

    return null
}

/**
 * Check if clipboard has canvas shapes
 */
export async function hasClipboardShapes(): Promise<boolean> {
    try {
        const text = await navigator.clipboard.readText()
        const data = JSON.parse(text)
        return data.type === 'canvas-shapes' && data.version === 1
    } catch {
        const stored = localStorage.getItem('canvas-clipboard')
        if (stored) {
            try {
                const data = JSON.parse(stored)
                return data.type === 'canvas-shapes' && data.version === 1
            } catch {
                return false
            }
        }
        return false
    }
}
