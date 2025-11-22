import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ShapeUtil } from './ShapeUtil'
import { TextShape, TextShapeProps } from '../shapes/types'
import 'katex/dist/katex.min.css'

export class TextShapeUtil extends ShapeUtil<TextShape> {
    readonly type = 'text' as const

    getDefaultProps(): TextShapeProps {
        return {
            text: 'Double click to edit',
            fontSize: 16,
            color: 'black',
            fontFamily: 'Inter, sans-serif',
            textAlign: 'left',
        }
    }

    component(shape: TextShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { id, x, y, width, height, props, opacity } = shape
        const { text, fontSize, color, fontFamily, textAlign } = props

        return (
            <foreignObject
                key={id}
                x={x}
                y={y}
                width={width}
                height={height}
                style={{ overflow: 'visible' }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        fontSize,
                        color,
                        fontFamily,
                        textAlign,
                        opacity,
                        padding: '4px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        userSelect: 'none'
                    }}
                    className="markdown-body"
                >
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                    >
                        {text}
                    </ReactMarkdown>
                </div>
            </foreignObject>
        )
    }

    override canEdit(): boolean {
        return true
    }
}
