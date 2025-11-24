/**
 * Utility functions for working with shapes
 */

import { Shape, ShapeId, ShapeType, ShapePropsMap, TextShape, RectShape, CircleShape, ArrowShape, ImageShape, PointerShape, Vec2, Bounds } from './types'

/**
 * Generate a unique shape ID
 */
export function createShapeId(): ShapeId {
    return `shape:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create default props for each shape type
 */
export function getDefaultShapeProps<T extends ShapeType>(type: T): ShapePropsMap[T] {
    switch (type) {
        case 'text':
            return {
                text: 'Text',
                fontSize: 16,
                color: '#ffffff',
                fontFamily: 'Inter, sans-serif',
                textAlign: 'left',
            } as ShapePropsMap[T]
        case 'rect':
            return {
                fill: 'transparent',
                stroke: '#ffffff',
                strokeWidth: 2,
                cornerRadius: 0,
            } as ShapePropsMap[T]
        case 'circle':
            return {
                fill: 'transparent',
                stroke: '#ffffff',
                strokeWidth: 2,
            } as ShapePropsMap[T]
        case 'arrow':
            return {
                start: { x: 0, y: 0 },
                end: { x: 100, y: 0 },
                strokeWidth: 2,
                color: '#ffffff',
                arrowheadStart: 'none',
                arrowheadEnd: 'arrow',
                bend: 0,
            } as ShapePropsMap[T]
        case 'image':
            return {
                assetId: '',
            } as ShapePropsMap[T]
        case 'pointer':
            return {
                assetId: '',
            } as ShapePropsMap[T]
        case 'paper-node':
            return {
                paperId: 0,
                title: '',
                authors: [],
                year: '',
                journal: ''
            } as ShapePropsMap[T]
        default:
            throw new Error(`Unknown shape type: ${type}`)
    }
}

/**
 * Create a new shape with default values
 */
export function createShape<T extends ShapeType>(
    type: T,
    partial: Partial<Omit<Extract<Shape, { type: T }>, 'id' | 'type' | 'props' | 'meta'>> & {
        props?: Partial<Extract<Shape, { type: T }>['props']>
    } = {}
): Extract<Shape, { type: T }> {
    const defaultProps = getDefaultShapeProps(type)

    return {
        id: createShapeId(),
        type,
        x: partial.x ?? 0,
        y: partial.y ?? 0,
        width: partial.width ?? 100,
        height: partial.height ?? 100,
        rotation: partial.rotation ?? 0,
        opacity: partial.opacity ?? 1,
        props: { ...defaultProps, ...partial.props } as any,
        meta: {},
    } as Extract<Shape, { type: T }>
}

/**
 * Get the bounding box of a shape
 */
export function getShapeBounds(shape: Shape): Bounds {
    return {
        x: shape.x,
        y: shape.y,
        w: shape.width,
        h: shape.height,
    }
}

/**
 * Check if a point is inside a shape's bounds
 */
export function isPointInShape(shape: Shape, point: Vec2): boolean {
    const bounds = getShapeBounds(shape)
    return (
        point.x >= bounds.x &&
        point.x <= bounds.x + bounds.w &&
        point.y >= bounds.y &&
        point.y <= bounds.y + bounds.h
    )
}

/**
 * Type guard functions
 */
export function isTextShape(shape: Shape): shape is TextShape {
    return shape.type === 'text'
}

export function isRectShape(shape: Shape): shape is RectShape {
    return shape.type === 'rect'
}

export function isCircleShape(shape: Shape): shape is CircleShape {
    return shape.type === 'circle'
}

export function isArrowShape(shape: Shape): shape is ArrowShape {
    return shape.type === 'arrow'
}

export function isImageShape(shape: Shape): shape is ImageShape {
    return shape.type === 'image'
}

export function isPointerShape(shape: Shape): shape is PointerShape {
    return shape.type === 'pointer'
}
