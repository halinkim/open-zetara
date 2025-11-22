/**
 * PointerShapeUtil - Handles rendering and interaction for PDF pointer shapes
 */

import React from 'react'
import { ShapeUtil } from './ShapeUtil'
import { PointerShape, PointerShapeProps, Bounds } from '../shapes/types'
import { useAsset } from '../context/AssetContext'

const PointerShapeInner = ({ shape, isSelected }: { shape: PointerShape; isSelected: boolean }) => {
    const { id, x, y, width, height, props, opacity } = shape
    const { assetId } = props
    const asset = useAsset(assetId)

    // If asset is not found, render a placeholder or nothing
    const href = asset ? asset.src : ''

    return (
        <g key={id}>
            {/* Pointer snapshot image */}
            <image
                x={x}
                y={y}
                width={width}
                height={height}
                href={href}
                opacity={opacity}
                preserveAspectRatio="none"
                pointerEvents="all"
                style={{ cursor: 'pointer' }}
            />

            {/* Optional: PDF indicator icon overlay */}
            {isSelected && (
                <g transform={`translate(${x + width - 24}, ${y + 4})`}>
                    <circle
                        cx={12}
                        cy={12}
                        r={10}
                        fill="white"
                        stroke="#666"
                        strokeWidth={1}
                        opacity={0.9}
                    />
                    <text
                        x={12}
                        y={16}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#666"
                        pointerEvents="none"
                    >
                        PDF
                    </text>
                </g>
            )}
        </g>
    )
}

export class PointerShapeUtil extends ShapeUtil<PointerShape> {
    readonly type = 'pointer' as const

    getDefaultProps(): PointerShapeProps {
        return {
            assetId: '',
        }
    }

    component(shape: PointerShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        return <PointerShapeInner shape={shape} isSelected={isSelected} />
    }

    override onResize(
        shape: PointerShape,
        info: { initialBounds: Bounds; newBounds: Bounds; handle: any }
    ): Partial<PointerShape> {
        const { newBounds } = info

        return {
            x: newBounds.x,
            y: newBounds.y,
            width: newBounds.w,
            height: newBounds.h,
        }
    }

    override onDoubleClick(shape: PointerShape): void {
        // Signal to navigate to PDF page
        // Editor will handle this with access to asset metadata
    }
}
