/**
 * Canvas Shape Type System
 * 
 * Based on tldraw's TLBaseShape pattern. All shapes share a common base
 * structure with type-specific properties in the 'props' field.
 */

// ============================================================================
// Base Shape
// ============================================================================

export type ShapeId = string // 'shape:abc123'
export type ShapeType = 'text' | 'rect' | 'circle' | 'arrow' | 'image' | 'pointer'

/**
 * Base interface for all shapes.
 * Every shape extends this with type-specific props.
 */
export interface BaseShape<Type extends ShapeType, Props extends object> {
    id: ShapeId
    type: Type

    // Position and transform
    x: number
    y: number
    width: number
    height: number
    rotation: number

    // Visual
    opacity: number

    // Type-specific properties
    props: Props

    // User metadata (for future use)
    meta: Record<string, unknown>
}

// ============================================================================
// Text Shape
// ============================================================================

export interface TextShapeProps {
    text: string
    fontSize: number
    color: string
    fontFamily: string
    textAlign: 'left' | 'center' | 'right'
}

export type TextShape = BaseShape<'text', TextShapeProps>

// ============================================================================
// Rectangle Shape
// ============================================================================

export interface RectShapeProps {
    fill: string
    stroke: string
    strokeWidth: number
    cornerRadius: number
}

export type RectShape = BaseShape<'rect', RectShapeProps>

// ============================================================================
// Circle Shape
// ============================================================================

export interface CircleShapeProps {
    fill: string
    stroke: string
    strokeWidth: number
}

export type CircleShape = BaseShape<'circle', CircleShapeProps>

// ============================================================================
// Arrow Shape
// ============================================================================

export type ConnectionAnchor = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

export interface ConnectionPoint {
    type: 'point' | 'binding'
    x?: number
    y?: number
    shapeId?: ShapeId
    anchor?: ConnectionAnchor
}

export interface ArrowShapeProps {
    from: ConnectionPoint
    to: ConnectionPoint
    strokeWidth: number
    color: string
    arrowheadStart: 'none' | 'arrow' | 'dot'
    arrowheadEnd: 'none' | 'arrow' | 'dot'
    bend: number // Curve amount
}

export type ArrowShape = BaseShape<'arrow', ArrowShapeProps>

// ============================================================================
// Image Shape
// ============================================================================

export interface ImageShapeProps {
    assetId: string // References Asset
}

export type ImageShape = BaseShape<'image', ImageShapeProps>

// ============================================================================
// Pointer Shape (PDF Reference)
// ============================================================================

export interface PointerShapeProps {
    assetId: string // References Asset with PDF metadata
}

export type PointerShape = BaseShape<'pointer', PointerShapeProps>

// ============================================================================
// Union Type
// ============================================================================

export type Shape =
    | TextShape
    | RectShape
    | CircleShape
    | ArrowShape
    | ImageShape
    | PointerShape

// ============================================================================
// Helper Types
// ============================================================================

export type ShapePropsMap = {
    text: TextShapeProps
    rect: RectShapeProps
    circle: CircleShapeProps
    arrow: ArrowShapeProps
    image: ImageShapeProps
    pointer: PointerShapeProps
}

export type Vec2 = { x: number; y: number }
export type Bounds = { x: number; y: number; w: number; h: number }
