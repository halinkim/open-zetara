/**
 * ArrowShapeUtil - Handles rendering and interaction for arrow shapes
 */

import React from 'react'
import { ShapeUtil } from './ShapeUtil'
import { ArrowShape, ArrowShapeProps, Bounds, Vec2 } from '../shapes/types'

export class ArrowShapeUtil extends ShapeUtil<ArrowShape> {
    readonly type = 'arrow' as const

    getDefaultProps(): ArrowShapeProps {
        return {
            from: { type: 'point', x: 0, y: 0 },
            to: { type: 'point', x: 100, y: 0 },
            strokeWidth: 2,
            color: '#1e1e1e',
            arrowheadStart: 'none',
            arrowheadEnd: 'arrow',
            bend: 0,
        }
    }

    component(shape: ArrowShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { id, props, opacity } = shape
        const { from, to, strokeWidth, color, arrowheadStart, arrowheadEnd, bend } = props

        // Calculate actual start and end points
        const startX = from.type === 'point' ? (from.x ?? 0) : 0
        const startY = from.type === 'point' ? (from.y ?? 0) : 0
        const endX = to.type === 'point' ? (to.x ?? 100) : 100
        const endY = to.type === 'point' ? (to.y ?? 0) : 0

        // Simple path (no curve for now, will enhance later)
        const pathD = this.getArrowPath(startX, startY, endX, endY, bend)

        return (
            <g key={id} opacity={opacity}>
                {/* Main arrow line */}
                <path
                    d={pathD}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    pointerEvents="stroke"
                />

                {/* Start arrowhead */}
                {arrowheadStart !== 'none' && this.renderArrowhead(startX, startY, endX, endY, arrowheadStart, color, strokeWidth, true)}

                {/* End arrowhead */}
                {arrowheadEnd !== 'none' && this.renderArrowhead(startX, startY, endX, endY, arrowheadEnd, color, strokeWidth, false)}
            </g>
        )
    }

    private getArrowPath(x1: number, y1: number, x2: number, y2: number, bend: number): string {
        if (bend === 0) {
            return `M ${x1} ${y1} L ${x2} ${y2}`
        }

        // Simple quadratic curve
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2
        const dx = x2 - x1
        const dy = y2 - y1
        const perpX = -dy
        const perpY = dx
        const len = Math.sqrt(perpX * perpX + perpY * perpY)
        const bendAmount = bend * 50
        const ctrlX = midX + (perpX / len) * bendAmount
        const ctrlY = midY + (perpY / len) * bendAmount

        return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`
    }

    private renderArrowhead(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        type: 'arrow' | 'dot',
        color: string,
        strokeWidth: number,
        isStart: boolean
    ): React.ReactNode {
        const [px, py] = isStart ? [x1, y1] : [x2, y2]
        const angle = Math.atan2(y2 - y1, x2 - x1) + (isStart ? Math.PI : 0)

        if (type === 'dot') {
            return (
                <circle
                    cx={px}
                    cy={py}
                    r={strokeWidth * 2}
                    fill={color}
                    pointerEvents="none"
                />
            )
        }

        // Arrow head
        const size = strokeWidth * 4
        const points = [
            [px, py],
            [px - size * Math.cos(angle - Math.PI / 6), py - size * Math.sin(angle - Math.PI / 6)],
            [px - size * Math.cos(angle + Math.PI / 6), py - size * Math.sin(angle + Math.PI / 6)],
        ]

        return (
            <polygon
                points={points.map(p => p.join(',')).join(' ')}
                fill={color}
                pointerEvents="none"
            />
        )
    }

    override getBounds(shape: ArrowShape): Bounds {
        const { from, to } = shape.props
        const x1 = from.type === 'point' ? (from.x ?? 0) : 0
        const y1 = from.type === 'point' ? (from.y ?? 0) : 0
        const x2 = to.type === 'point' ? (to.x ?? 100) : 100
        const y2 = to.type === 'point' ? (to.y ?? 0) : 0

        const minX = Math.min(x1, x2)
        const minY = Math.min(y1, y2)
        const maxX = Math.max(x1, x2)
        const maxY = Math.max(y1, y2)

        return {
            x: minX,
            y: minY,
            w: maxX - minX,
            h: maxY - minY,
        }
    }

    override hitTest(shape: ArrowShape, point: Vec2): boolean {
        // Simple bounding box hit test for now
        // TODO: More precise path-based hit testing
        const bounds = this.getBounds(shape)
        const padding = shape.props.strokeWidth * 2
        return (
            point.x >= bounds.x - padding &&
            point.x <= bounds.x + bounds.w + padding &&
            point.y >= bounds.y - padding &&
            point.y <= bounds.y + bounds.h + padding
        )
    }
}
