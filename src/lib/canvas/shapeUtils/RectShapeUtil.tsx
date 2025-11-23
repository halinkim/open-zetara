/**
 * RectShapeUtil - Handles rendering and interaction for rectangle shapes
 */

import React from 'react'
import { ShapeUtil } from './ShapeUtil'
import { RectShape, RectShapeProps, Bounds } from '../shapes/types'
import { getColorValue, getStrokeWidth as getSizeStrokeWidth, getFillValue, getDashArray } from '../styles/styleUtils'

export class RectShapeUtil extends ShapeUtil<RectShape> {
    readonly type = 'rect' as const

    getDefaultProps(): RectShapeProps {
        return {
            fill: 'transparent',
            strokeWidth: 2,
            cornerRadius: 0,
        }
    }

    /**
     * Get stroke color from props
     * Priority: color style prop > direct stroke > default
     */
    private getStrokeColor(props: RectShapeProps): string {
        // If color is set via style panel, use it
        if (props.color) return getColorValue(props.color)
        // Otherwise use direct stroke (for backward compatibility)
        if (props.stroke) return props.stroke
        return '#ffffff'
    }

    /**
     * Get fill color from props
     * Priority: direct fill (if hex) > color + fill style props > direct fill > default
     */
    private getFillColor(props: RectShapeProps): string {
        // If fill is a direct color value (starts with #), use it
        if (props.fill && props.fill.startsWith('#')) return props.fill

        // If we have both color and fill style props, compute the fill
        if (props.color && props.fill) return getFillValue(props.color, props.fill)

        // Otherwise use the direct fill value
        if (props.fill) return props.fill

        return 'transparent'
    }

    /**
     * Get stroke width from props
     * Priority: size style prop > direct strokeWidth > default
     */
    private getStrokeWidthValue(props: RectShapeProps): number {
        // If size is explicitly set via style panel, use it
        if (props.size) return getSizeStrokeWidth(props.size)
        // Otherwise use direct strokeWidth
        if (props.strokeWidth) return props.strokeWidth
        return 2
    }

    component(shape: RectShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { id, x, y, width, height, props, opacity } = shape

        const strokeColor = this.getStrokeColor(props)
        const fillColor = this.getFillColor(props)
        const strokeWidth = this.getStrokeWidthValue(props)
        const dashArray = getDashArray(props.dash, strokeWidth)

        return (
            <rect
                key={id}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                rx={props.cornerRadius}
                ry={props.cornerRadius}
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
