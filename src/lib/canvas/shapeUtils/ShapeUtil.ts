/**
 * ShapeUtil Base Class
 * 
 * Encapsulates all shape-specific logic for a particular shape type.
 * Each shape type (text, rect, circle, etc.) has its own ShapeUtil implementation.
 * 
 * Inspired by tldraw's ShapeUtil pattern.
 */

import { Shape, ShapeType, Vec2, Bounds } from '../shapes/types'
import React from 'react'

/**
 * Base ShapeUtil class
 * Extend this to create shape-specific utilities
 */
export abstract class ShapeUtil<S extends Shape = Shape> {
    /**
     * The shape type this util handles
     */
    abstract readonly type: ShapeType

    /**
     * Get default props for creating a new shape of this type
     */
    abstract getDefaultProps(): S['props']

    /**
     * Render the shape as a React component
     * @param shape - The shape to render
     * @param isSelected - Whether the shape is selected
     * @param isEditing - Whether the shape is being edited
     */
    abstract component(shape: S, isSelected: boolean, isEditing: boolean): React.ReactNode

    /**
     * Get the bounding box of the shape
     * Used for hit testing, selection, etc.
     */
    getBounds(shape: S): Bounds {
        return {
            x: shape.x,
            y: shape.y,
            w: shape.width,
            h: shape.height,
        }
    }

    /**
     * Test if a point is inside the shape
     * Default implementation uses bounding box
     * Override for more precise hit testing (e.g., circles)
     */
    hitTest(shape: S, point: Vec2): boolean {
        const bounds = this.getBounds(shape)
        return (
            point.x >= bounds.x &&
            point.x <= bounds.x + bounds.w &&
            point.y >= bounds.y &&
            point.y <= bounds.y + bounds.h
        )
    }

    /**
     * Render selection indicator
     * Returns SVG element(s) to show when shape is selected
     */
    indicator(shape: S): React.ReactNode {
        const bounds = this.getBounds(shape)
        return React.createElement('rect', {
            x: bounds.x,
            y: bounds.y,
            width: bounds.w,
            height: bounds.h,
            fill: 'none',
            stroke: 'var(--color-selection)',
            strokeWidth: 2,
            pointerEvents: 'none',
        })
    }

    /**
     * Whether the shape can be edited (e.g., double-click to edit text)
     */
    canEdit(): boolean {
        return false
    }

    /**
     * Called when shape editing starts
     */
    onEditStart?(shape: S): void

    /**
     * Called when shape editing ends
     * Can return updated shape or null to keep unchanged
     */
    onEditEnd?(shape: S): Partial<S> | null

    /**
     * Called when shape is resized
     * Returns updated shape properties
     */
    onResize?(
        shape: S,
        info: {
            initialBounds: Bounds
            newBounds: Bounds
            handle: ResizeHandle
        }
    ): Partial<S>

    /**
     * Called when shape is double-clicked
     */
    onDoubleClick?(shape: S): void
}

/**
 * Resize handle positions
 */
export type ResizeHandle =
    | 'nw' | 'n' | 'ne'
    | 'w' | 'e'
    | 'sw' | 's' | 'se'

/**
 * Registry of shape utilities
 * Maps shape type to its ShapeUtil instance
 */
export class ShapeUtilRegistry {
    private utils = new Map<ShapeType, ShapeUtil>()

    register<S extends Shape>(util: ShapeUtil<S>): void {
        this.utils.set(util.type, util)
    }

    get<S extends Shape>(type: S['type']): ShapeUtil<S> {
        const util = this.utils.get(type)
        if (!util) {
            throw new Error(`No ShapeUtil registered for type: ${type}`)
        }
        return util as ShapeUtil<S>
    }

    getForShape<S extends Shape>(shape: S): ShapeUtil<S> {
        return this.get(shape.type)
    }
}
