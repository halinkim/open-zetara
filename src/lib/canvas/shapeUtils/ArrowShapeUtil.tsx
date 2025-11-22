import React from 'react'
import { ArrowShape, ConnectionAnchor, Bounds } from '../shapes/types'
import { ShapeUtil } from './ShapeUtil'
import { useEditorContext } from '../context/EditorContext'

// Helper to get anchor position from a shape
function getAnchorPosition(shape: any, anchor: ConnectionAnchor): { x: number; y: number } {
    const { x, y, width, height } = shape
    switch (anchor) {
        case 'n': return { x: x + width / 2, y }
        case 'ne': return { x: x + width, y }
        case 'e': return { x: x + width, y: y + height / 2 }
        case 'se': return { x: x + width, y: y + height }
        case 's': return { x: x + width / 2, y: y + height }
        case 'sw': return { x, y: y + height }
        case 'w': return { x, y: y + height / 2 }
        case 'nw': return { x, y }
    }
    return { x, y }
}

function generateBezierPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromAnchor: ConnectionAnchor = 'e',
    toAnchor: ConnectionAnchor = 'w',
    bend: number = 0
): string {
    if (bend === 0) {
        return `M ${from.x},${from.y} L ${to.x},${to.y}`
    }

    const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2)
    const offset = Math.min(distance * 0.4, 100)

    const directionMap: Record<ConnectionAnchor, { dx: number; dy: number }> = {
        'n': { dx: 0, dy: -1 },
        'ne': { dx: 0.7, dy: -0.7 },
        'e': { dx: 1, dy: 0 },
        'se': { dx: 0.7, dy: 0.7 },
        's': { dx: 0, dy: 1 },
        'sw': { dx: -0.7, dy: 0.7 },
        'w': { dx: -1, dy: 0 },
        'nw': { dx: -0.7, dy: -0.7 }
    }

    const fromDir = directionMap[fromAnchor]
    const toDir = directionMap[toAnchor]

    const cp1 = {
        x: from.x + fromDir.dx * offset,
        y: from.y + fromDir.dy * offset
    }

    const cp2 = {
        x: to.x + toDir.dx * offset,
        y: to.y + toDir.dy * offset
    }

    return `M ${from.x},${from.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`
}

function ArrowShapeInner({ shape, isSelected }: { shape: ArrowShape, isSelected: boolean }) {
    const editor = useEditorContext()

    // Resolve start/end points
    let start = shape.props.start || { x: 0, y: 0 }
    let end = shape.props.end || { x: 0, y: 0 }
    let startAnchor: ConnectionAnchor = 'e'
    let endAnchor: ConnectionAnchor = 'w'

    // Calculate absolute positions for rendering
    let absStart = { x: shape.x + start.x, y: shape.y + start.y }
    let absEnd = { x: shape.x + end.x, y: shape.y + end.y }

    // Handle bindings
    if (shape.props.startBinding) {
        const startShape = editor.getShape(shape.props.startBinding.shapeId)
        if (startShape) {
            const pos = getAnchorPosition(startShape, shape.props.startBinding.anchor)
            absStart = pos
            startAnchor = shape.props.startBinding.anchor
        }
    }

    if (shape.props.endBinding) {
        const endShape = editor.getShape(shape.props.endBinding.shapeId)
        if (endShape) {
            const pos = getAnchorPosition(endShape, shape.props.endBinding.anchor)
            absEnd = pos
            endAnchor = shape.props.endBinding.anchor
        }
    }

    // Map size to strokeWidth
    const sizeMap = {
        s: 2,
        m: 4,
        l: 6,
        xl: 8
    }
    const strokeWidth = shape.props.strokeWidth || sizeMap[shape.props.size || 'm']

    const path = generateBezierPath(absStart, absEnd, startAnchor, endAnchor, shape.props.bend)

    return (
        <svg style={{ overflow: 'visible', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
            <defs>
                <marker
                    id={`arrowhead-end-${shape.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="0 0, 10 3.5, 0 7" fill={shape.props.color || 'black'} />
                </marker>
                <marker
                    id={`arrowhead-start-${shape.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="1"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="10 0, 0 3.5, 10 7" fill={shape.props.color || 'black'} />
                </marker>
            </defs>
            <path
                d={path}
                stroke={shape.props.color || 'black'}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={shape.props.dash === 'dashed' ? '5,5' : shape.props.dash === 'dotted' ? '2,2' : undefined}
                markerStart={shape.props.arrowheadStart === 'arrow' ? `url(#arrowhead-start-${shape.id})` : undefined}
                markerEnd={shape.props.arrowheadEnd === 'arrow' ? `url(#arrowhead-end-${shape.id})` : undefined}
                style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            />

            {/* Handles for selection */}
            {isSelected && (
                <>
                    <circle
                        cx={absStart.x}
                        cy={absStart.y}
                        r={4}
                        fill="white"
                        stroke="#0d99ff"
                        strokeWidth={2}
                        style={{ pointerEvents: 'all', cursor: 'move' }}
                        data-handle="start"
                        data-shape-id={shape.id}
                    />
                    <circle
                        cx={absEnd.x}
                        cy={absEnd.y}
                        r={4}
                        fill="white"
                        stroke="#0d99ff"
                        strokeWidth={2}
                        style={{ pointerEvents: 'all', cursor: 'move' }}
                        data-handle="end"
                        data-shape-id={shape.id}
                    />
                </>
            )}
        </svg>
    )
}

export class ArrowShapeUtil extends ShapeUtil<ArrowShape> {
    type = 'arrow' as const

    getDefaultProps(): ArrowShape['props'] {
        return {
            start: { x: 0, y: 0 },
            end: { x: 100, y: 100 },
            strokeWidth: 2,
            color: 'black',
            arrowheadStart: 'none',
            arrowheadEnd: 'arrow',
            bend: 0
        }
    }

    getBounds(shape: ArrowShape): Bounds {
        const start = shape.props.start || { x: 0, y: 0 }
        const end = shape.props.end || { x: 0, y: 0 }

        const minX = Math.min(start.x, end.x)
        const minY = Math.min(start.y, end.y)
        const maxX = Math.max(start.x, end.x)
        const maxY = Math.max(start.y, end.y)

        return {
            x: shape.x + minX,
            y: shape.y + minY,
            w: Math.max(1, maxX - minX),
            h: Math.max(1, maxY - minY)
        }
    }

    hitTest(shape: ArrowShape, point: { x: number, y: number }): boolean {
        const start = { x: shape.x + (shape.props.start?.x || 0), y: shape.y + (shape.props.start?.y || 0) }
        const end = { x: shape.x + (shape.props.end?.x || 0), y: shape.y + (shape.props.end?.y || 0) }

        // Distance from point to line segment
        const l2 = (end.x - start.x) ** 2 + (end.y - start.y) ** 2
        if (l2 === 0) return false

        const t = ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) / l2
        const tClamped = Math.max(0, Math.min(1, t))

        const proj = {
            x: start.x + tClamped * (end.x - start.x),
            y: start.y + tClamped * (end.y - start.y)
        }

        const dist = Math.sqrt((point.x - proj.x) ** 2 + (point.y - proj.y) ** 2)
        return dist < 10 // Hit threshold
    }

    component(shape: ArrowShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        return <ArrowShapeInner shape={shape} isSelected={isSelected} />
    }
}
