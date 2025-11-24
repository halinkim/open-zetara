/**
 * PaperNodeUtil - Handles rendering and interaction for paper nodes
 */

import React from 'react'
import { ShapeUtil } from './ShapeUtil'
import { PaperNodeShape, PaperNodeShapeProps, Bounds } from '../shapes/types'
import { PaperNodeComponent } from '../shapes/PaperNode'

export class PaperNodeUtil extends ShapeUtil<PaperNodeShape> {
    readonly type = 'paper-node' as const

    getDefaultProps(): PaperNodeShapeProps {
        return {
            paperId: 0,
            title: '',
            authors: [],
            year: '',
            journal: ''
        }
    }

    component(shape: PaperNodeShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { x, y, width, height, opacity } = shape

        return (
            <foreignObject
                x={x}
                y={y}
                width={width}
                height={height}
                style={{ opacity }}
            >
                <div style={{ width: '100%', height: '100%', pointerEvents: 'all' }}>
                    <PaperNodeComponent
                        shape={shape}
                        isSelected={isSelected}
                        isEditing={isEditing}
                    />
                </div>
            </foreignObject>
        )
    }

    override onResize(
        shape: PaperNodeShape,
        info: { initialBounds: Bounds; newBounds: Bounds; handle: any }
    ): Partial<PaperNodeShape> {
        const { newBounds } = info

        return {
            x: newBounds.x,
            y: newBounds.y,
            width: newBounds.w,
            height: newBounds.h,
        }
    }
}
