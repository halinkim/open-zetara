/**
 * RectShapeUtil - Handles rendering and interaction for rectangle shapes
 */

import React from 'react'
import { ShapeUtil } from './ShapeUtil'
import { RectShape, RectShapeProps, Bounds } from '../shapes/types'

export class RectShapeUtil extends ShapeUtil<RectShape> {
    readonly type = 'rect' as const

    getDefaultProps(): RectShapeProps {
        return {
            fill: 'transparent',
            stroke: '#ffffff',
            strokeWidth: 2,
            cornerRadius: 0,
        }
    }

    component(shape: RectShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { id, x, y, width, height, props, opacity } = shape
        const { fill, stroke, strokeWidth, cornerRadius } = props

        return (
            <rect
                key={id}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                rx={cornerRadius}
                ry={cornerRadius}
                opacity={opacity}
                pointerEvents="all"
            />
        )
    }

    override onResize(
        shape: RectShape,
        info: { initialBounds: Bounds; newBounds: Bounds; handle: any }
    ): Partial<RectShape> {
        const { newBounds } = info

        return {
            x: newBounds.x,
            y: newBounds.y,
            width: newBounds.w,
            height: newBounds.h,
        }
    }
}
