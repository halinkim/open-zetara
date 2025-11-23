/**
 * Utility functions for history management
 */

import { BaseShape } from '../../shapes/types'

export interface EditorStateSnapshot {
    shapes: Record<string, BaseShape<any, any>>
    selectedShapeIds: string[]
}

/**
 * Capture current shapes state
 */
export function captureShapesState(shapes: Map<string, BaseShape<any, any>>): Record<string, BaseShape<any, any>> {
    const captured: Record<string, BaseShape<any, any>> = {}

    shapes.forEach((shape, id) => {
        // Deep clone to prevent mutations
        captured[id] = structuredClone(shape)
    })

    return captured
}

/**
 * Capture full editor state for history
 */
export function captureEditorState(
    shapes: Map<string, BaseShape<any, any>>,
    selectedShapeIds: string[]
): EditorStateSnapshot {
    return {
        shapes: captureShapesState(shapes),
        selectedShapeIds: [...selectedShapeIds]
    }
}

/**
 * Restore shapes state from snapshot
 */
export function restoreShapesState(
    shapesMap: Map<string, BaseShape<any, any>>,
    snapshot: Record<string, BaseShape<any, any>>
): void {
    // Clear existing shapes
    shapesMap.clear()

    // Restore from snapshot
    for (const [id, shape] of Object.entries(snapshot)) {
        shapesMap.set(id, structuredClone(shape))
    }
}

/**
 * Restore full editor state from snapshot
 */
export function restoreEditorState(
    shapesMap: Map<string, BaseShape<any, any>>,
    selectedShapeIds: string[],
    snapshot: EditorStateSnapshot
): { shapes: Map<string, BaseShape<any, any>>; selectedShapeIds: string[] } {
    restoreShapesState(shapesMap, snapshot.shapes)

    return {
        shapes: shapesMap,
        selectedShapeIds: [...snapshot.selectedShapeIds]
    }
}

/**
 * Check if two state snapshots are equal (shallow comparison)
 */
export function areStatesEqual(a: EditorStateSnapshot, b: EditorStateSnapshot): boolean {
    // Check selected shapes
    if (a.selectedShapeIds.length !== b.selectedShapeIds.length) return false
    if (!a.selectedShapeIds.every((id, i) => id === b.selectedShapeIds[i])) return false

    // Check shapes count
    const aKeys = Object.keys(a.shapes)
    const bKeys = Object.keys(b.shapes)
    if (aKeys.length !== bKeys.length) return false

    // Check shape IDs
    if (!aKeys.every(id => bKeys.includes(id))) return false

    // For performance, we don't do deep comparison of shapes
    // The history system will handle actual state changes
    return true
}
