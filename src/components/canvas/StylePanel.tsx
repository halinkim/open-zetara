import React from 'react'
import { Editor } from '@/lib/canvas/editor/Editor'
import { useEditorState } from '@/lib/canvas/editor'
import { StyleProps } from '@/lib/canvas/shapes/types'

interface StylePanelProps {
    editor: Editor
}

export function StylePanel({ editor }: StylePanelProps) {
    const state = useEditorState(editor)
    const selectedShapes = editor.getSelectedShapes()

    if (selectedShapes.length === 0) return null

    // Helper to update style
    const updateStyle = (key: keyof StyleProps, value: any) => {
        editor.updateShapes(selectedShapes.map(s => ({
            id: s.id,
            props: { ...s.props, [key]: value }
        })))
    }

    // Get common values (naive approach: take first)
    const firstShape = selectedShapes[0]
    const commonColor = (firstShape.props as any).color
    const commonSize = (firstShape.props as any).size
    const commonFill = (firstShape.props as any).fill
    const commonDash = (firstShape.props as any).dash

    return (
        <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            backgroundColor: '#333',
            padding: '8px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: 'white',
            zIndex: 100,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}
            onMouseDown={e => e.stopPropagation()}
        >
            {/* Color Picker */}
            <div style={{ display: 'flex', gap: '4px' }}>
                {['black', '#e03131', '#2f9e44', '#1971c2', '#f08c00'].map(color => (
                    <button
                        key={color}
                        onClick={() => updateStyle('color', color)}
                        style={{
                            width: 20,
                            height: 20,
                            backgroundColor: color,
                            border: commonColor === color ? '2px solid white' : 'none',
                            borderRadius: '50%',
                            cursor: 'pointer'
                        }}
                        title={color}
                    />
                ))}
            </div>

            {/* Size */}
            <div style={{ display: 'flex', gap: '4px' }}>
                {['s', 'm', 'l', 'xl'].map(size => (
                    <button
                        key={size}
                        onClick={() => updateStyle('size', size)}
                        style={{
                            padding: '2px 6px',
                            backgroundColor: commonSize === size ? '#555' : '#444',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {size.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Fill */}
            <div style={{ display: 'flex', gap: '4px' }}>
                {['none', 'semi', 'solid'].map(fill => (
                    <button
                        key={fill}
                        onClick={() => updateStyle('fill', fill)}
                        style={{
                            padding: '2px 6px',
                            backgroundColor: commonFill === fill ? '#555' : '#444',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {fill}
                    </button>
                ))}
            </div>

            {/* Dash */}
            <div style={{ display: 'flex', gap: '4px' }}>
                {['draw', 'solid', 'dashed', 'dotted'].map(dash => (
                    <button
                        key={dash}
                        onClick={() => updateStyle('dash', dash)}
                        style={{
                            padding: '2px 6px',
                            backgroundColor: commonDash === dash ? '#555' : '#444',
                            border: 'none',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {dash}
                    </button>
                ))}
            </div>
        </div>
    )
}
