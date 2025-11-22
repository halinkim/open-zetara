/**
 * TextShapeUtil - Handles rendering and interaction for text shapes
 */

import React from 'react'
import { ShapeUtil } from './ShapeUtil'
import { TextShape, TextShapeProps, Bounds } from '../shapes/types'

export class TextShapeUtil extends ShapeUtil<TextShape> {
    readonly type = 'text' as const

    getDefaultProps(): TextShapeProps {
        return {
            text: 'Text',
            fontSize: 16,
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
            textAlign: 'left',
        }
    }

    component(shape: TextShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { id, x, y, width, height, props, opacity } = shape
        const { text, fontSize, color, fontFamily, textAlign } = props

        // Text needs to be rendered as SVG foreignObject, not HTML div
        return React.createElement('foreignObject', {
            key: id,
            x,
            y,
            width,
            height,
        }, React.createElement('div', {
            xmlns: "http://www.w3.org/1999/xhtml",
            style: {
                width: '100%',
                height: '100%',
                fontSize,
                color,
                fontFamily,
                textAlign,
                opacity,
                padding: '4px',
                boxSizing: 'border-box',
            }
        }, text))
    }

    override canEdit(): boolean {
        return true
    }

    override onResize(
        shape: TextShape,
        info: { initialBounds: Bounds; newBounds: Bounds; handle: any }
    ): Partial<TextShape> {
        const { newBounds } = info

        return {
            x: newBounds.x,
            y: newBounds.y,
            width: newBounds.w,
            height: newBounds.h,
        }
    }
}
