/**
 * ImageShapeUtil - Handles rendering and interaction for image shapes
 */

import React from 'react'
import { ShapeUtil } from './ShapeUtil'
import { ImageShape, ImageShapeProps, Bounds } from '../shapes/types'

export class ImageShapeUtil extends ShapeUtil<ImageShape> {
    readonly type = 'image' as const

    getDefaultProps(): ImageShapeProps {
        return {
            assetId: '',
        }
    }

    component(shape: ImageShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { id, x, y, width, height, props, opacity } = shape
        const { assetId } = props

        // Note: Actual image src will be resolved by the rendering component
        // which has access to the asset registry

        return (
            <image
                key={id}
                x={x}
                y={y}
                width={width}
                height={height}
                href={`#asset-${assetId}`} // Placeholder - will be resolved
                opacity={opacity}
                preserveAspectRatio="none"
                pointerEvents="all"
            />
        )
    }

    override onResize(
        shape: ImageShape,
        info: { initialBounds: Bounds; newBounds: Bounds; handle: any }
    ): Partial<ImageShape> {
        const { newBounds } = info

        return {
            x: newBounds.x,
            y: newBounds.y,
            width: newBounds.w,
            height: newBounds.h,
        }
    }
}
