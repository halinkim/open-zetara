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
export type ShapeType = 'text' | 'rect' | 'circle' | 'arrow' | 'image' | 'pointer' | 'paper-node'

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
    index: number // For z-index ordering

    // Visual
    opacity: number

    // Type-specific properties
    props: Props

    // User metadata (for future use)
    meta: Record<string, unknown>
}

// ============================================================================
// Shared Style Props
// ============================================================================

export interface StyleProps {
    color?: string
    size?: 's' | 'm' | 'l' | 'xl'
    fill?: 'none' | 'semi' | 'solid'
    dash?: 'draw' | 'solid' | 'dashed' | 'dotted'
}

// ============================================================================
// Text Shape
// ============================================================================

export interface TextShapeProps extends StyleProps {
    text: string
    fontSize: number // Keep for backward compatibility or map to size
    fontFamily: string
    textAlign: 'left' | 'center' | 'right'
}

export type TextShape = BaseShape<'text', TextShapeProps>

// ============================================================================
// Rectangle Shape
// ============================================================================

export interface RectShapeProps extends Omit<StyleProps, 'fill'> {
    // fill can be either a direct CSS color OR a style fill value
    fill?: string | 'none' | 'semi' | 'solid'
    // Direct stroke color for backward compatibility
    stroke?: string
    strokeWidth: number
    cornerRadius: number
}

export type RectShape = BaseShape<'rect', RectShapeProps>

// ============================================================================
// Circle Shape
// ============================================================================

export interface CircleShapeProps extends Omit<StyleProps, 'fill'> {
    // fill can be either a direct CSS color OR a style fill value
    fill?: string | 'none' | 'semi' | 'solid'
    // Direct stroke color for backward compatibility
    stroke?: string
    strokeWidth: number
}

export type CircleShape = BaseShape<'circle', CircleShapeProps>

// ============================================================================
// Arrow Shape
// ============================================================================

export type ConnectionAnchor = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'

export interface ArrowBinding {
    shapeId: ShapeId
    anchor: ConnectionAnchor
}

export interface ArrowShapeProps extends StyleProps {
    start: { x: number, y: number }
    end: { x: number, y: number }
    startBinding?: ArrowBinding
    endBinding?: ArrowBinding
    strokeWidth: number
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
// Paper Node Shape
// ============================================================================

export interface PaperNodeShapeProps {
    paperId: number;
    title: string;
    authors: string[];
    year: string;
    journal?: string;
}

export type PaperNodeShape = BaseShape<'paper-node', PaperNodeShapeProps>

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
    | PaperNodeShape

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
    'paper-node': PaperNodeShapeProps
}

export type Vec2 = { x: number; y: number }
export type Bounds = { x: number; y: number; w: number; h: number }
