import React, { useEffect, useRef, useState } from 'react'
import { TextShape } from '@/lib/canvas/shapes/types'
import { Editor } from '@/lib/canvas/editor/Editor'

interface TextEditorProps {
    shape: TextShape
    zoom: number
    editor: Editor
}

export function TextEditor({ shape, zoom, editor }: TextEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [value, setValue] = useState(shape.props.text)

    // Focus and select all text on mount
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.focus()
            textarea.select()
        }
    }, [])

    // Update shape on change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        setValue(newValue)

        const currentShape = editor.getShape(shape.id)
        if (currentShape && currentShape.type === 'text') {
            editor.updateShape(shape.id, {
                props: {
                    ...currentShape.props,
                    text: newValue,
                },
            })
        }
    }

    // Blur on Escape, Shift+Enter
    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation() // Prevent canvas keyboard listeners
        if (e.key === 'Escape' || (e.key === 'Enter' && e.shiftKey)) {
            e.preventDefault()
            editor.setEditingShape(null)
        }
    }

    const handleBlur = () => {
        editor.setEditingShape(null)
    }

    return (
        <foreignObject
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            style={{ pointerEvents: 'all' }}
        >
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onMouseDown={(e) => e.stopPropagation()} // Prevent canvas click handling
                style={{
                    width: '100%',
                    height: '100%',
                    fontSize: shape.props.fontSize,
                    color: shape.props.color,
                    fontFamily: shape.props.fontFamily,
                    textAlign: shape.props.textAlign,
                    padding: '4px',
                    border: 'none',
                    outline: '2px solid #0d99ff',
                    background: 'rgba(30, 30, 30, 0.8)',
                    resize: 'none',
                    overflow: 'hidden',
                    whiteSpace: 'pre-wrap',
                }}
            />
        </foreignObject>
    )
}
