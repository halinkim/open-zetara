import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ShapeUtil } from './ShapeUtil'
import { TextShape, TextShapeProps } from '../shapes/types'
import { getColorValue, getFontSize } from '../styles/styleUtils'
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

    /**
     * Get text color from props
     * Priority: direct color (if hex/css) > color style prop > default
     */
    private getTextColor(props: TextShapeProps): string {
        // If color looks like a CSS color, use it directly
        if (props.color && (props.color.startsWith('#') || props.color === 'black' || props.color.startsWith('rgb'))) {
            return props.color
        }
        // Otherwise treat as style prop and convert
        if (props.color) {
            return getColorValue(props.color)
        }
        return 'black'
    }

    /**
     * Get font size from props
     * Priority: direct fontSize > size style prop > default
     */
    private getFontSizeValue(props: TextShapeProps): number {
        if (props.fontSize) return props.fontSize
        if (props.size) return getFontSize(props.size)
        return 16
    }

    component(shape: TextShape, isSelected: boolean, isEditing: boolean): React.ReactNode {
        const { id, x, y, width, height, props, opacity } = shape

        const textColor = this.getTextColor(props)
        const fontSize = this.getFontSizeValue(props)

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
                        color: textColor,
                        fontFamily: props.fontFamily,
                        textAlign: props.textAlign,
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
                        {props.text}
                    </ReactMarkdown>
                </div>
            </foreignObject>
        )
    }

    override canEdit(): boolean {
        return true
    }
}
