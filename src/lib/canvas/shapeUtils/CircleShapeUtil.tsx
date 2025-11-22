/**
 * CircleShapeUtil - Handles rendering and interaction for circle shapes
 */

import React from 'react'
import { ShapeUtil } from './ShapeUtil'
import { CircleShape, CircleShapeProps, Bounds, Vec2 } from '../shapes/types'

export class CircleShapeUtil extends ShapeUtil<CircleShape> {
    readonly type = 'circle' as const

    getDefaultProps(): CircleShapeProps {
        return {
            fill: 'transparent',
            stroke: '#ffffff',
            strokeWidth: 2,
        }
    }

    component(shape: CircleShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { id, x, y, width, height, props, opacity } = shape
        const { fill, stroke, strokeWidth } = props

        // Calculate center and radii for ellipse
        const cx = x + width / 2
        const cy = y + height / 2
        const rx = width / 2
        const ry = height / 2

        return (
            <ellipse
                key={id}
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                opacity={opacity}
                pointerEvents="all"
            />
        )
    }

    override hitTest(shape: CircleShape, point: Vec2): boolean {
        // More precise hit test for circles/ellipses
        const cx = shape.x + shape.width / 2
        const cy = shape.y + shape.height / 2
        const rx = shape.width / 2
        const ry = shape.height / 2

        // Ellipse equation: ((x-cx)/rx)^2 + ((y-cy)/ry)^2 <= 1
        const dx = (point.x - cx) / rx
        const dy = (point.y - cy) / ry
        return (dx * dx + dy * dy) <= 1
    }

    override onResize(
        shape: CircleShape,
        info: { initialBounds: Bounds; newBounds: Bounds; handle: any }
    ): Partial<CircleShape> {
        const { newBounds } = info

        return {
            x: newBounds.x,
            y: newBounds.y,
            width: newBounds.w,
            height: newBounds.h,
        }
    }
}
