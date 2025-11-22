/**
 * Canvas State Type System
 * 
 * Defines the complete canvas state structure.
 */

import { Shape, ShapeId } from '../shapes/types'
import { Asset, AssetId } from '../assets/types'

/**
 * Camera state (viewport)
 */
export interface Camera {
    x: number
    y: number
    zoom: number
}

/**
 * Complete canvas state
 */
export interface CanvasState {
    // Shapes stored as a map for efficient lookup
    shapes: Record<ShapeId, Shape>

    // Assets stored separately
    assets: Record<AssetId, Asset>

    // Selection state
    selectedIds: Set<ShapeId>

    // Editing state (for text editing, etc.)
    editingId: ShapeId | null

    // Camera/viewport
    camera: Camera
}

/**
 * Serializable canvas state (for DB storage)
 * Converts Sets to arrays for JSON serialization
 */
export interface SerializedCanvasState {
    shapes: Record<ShapeId, Shape>
    assets: Record<AssetId, Asset>
    selectedIds: ShapeId[]
    editingId: ShapeId | null
    camera: Camera
}

/**
 * Helper functions for serialization
 */
export function serializeCanvasState(state: CanvasState): SerializedCanvasState {
    return {
        shapes: state.shapes,
        assets: state.assets,
        selectedIds: Array.from(state.selectedIds),
        editingId: state.editingId,
        camera: state.camera,
    }
}

export function deserializeCanvasState(serialized: SerializedCanvasState): CanvasState {
    return {
        shapes: serialized.shapes,
        assets: serialized.assets,
        selectedIds: new Set(serialized.selectedIds),
        editingId: serialized.editingId,
        camera: serialized.camera,
    }
}

/**
 * Initial/empty canvas state
 */
export function createEmptyCanvasState(): CanvasState {
    return {
        shapes: {},
        assets: {},
        selectedIds: new Set(),
        editingId: null,
        camera: {
            x: 0,
            y: 0,
            zoom: 1,
        },
    }
}
