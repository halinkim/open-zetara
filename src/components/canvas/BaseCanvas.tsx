import React, { useRef } from 'react'
import { Editor } from '@/lib/canvas/editor'
import { CanvasToolbar, CanvasTool } from './CanvasToolbar'
import { StylePanel } from './StylePanel'
import { AssetProvider } from '@/lib/canvas/context/AssetContext'
import { EditorProvider } from '@/lib/canvas/context/EditorContext'
import { useCanvasInteraction } from './hooks/useCanvasInteraction'
import { defaultShapeUtils } from '@/lib/canvas/shapeUtils'
import { ResizeHandles } from './ResizeHandles'
import { TextEditor } from './TextEditor'
import { Shape } from '@/lib/canvas/store/types'

import { CanvasState } from '@/lib/canvas/store/types'

interface BaseCanvasProps {
    editor: Editor;
    state: CanvasState;
    currentTool: CanvasTool;
    onToolChange: (tool: CanvasTool) => void;
    children?: React.ReactNode;
}

export function BaseCanvas({ editor, state, currentTool, onToolChange, children }: BaseCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)

    // Use the interaction hook
    const {
        isPanning,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleResizeStart,
        handleDoubleClick,
        handleDragOver,
        handleDrop,
        snapLines
    } = useCanvasInteraction(editor, containerRef, currentTool, onToolChange)

    const shapes = Object.values(state.shapes).sort((a, b) => ((a as Shape).index || 0) - ((b as Shape).index || 0)) as Shape[]

    return (
        <EditorProvider value={editor}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Toolbar */}
                <CanvasToolbar currentTool={currentTool} onToolChange={onToolChange} />

                {/* Style Panel */}
                <StylePanel editor={editor} />

                {/* Canvas Container */}
                <div
                    ref={containerRef}
                    style={{
                        flex: 1,
                        overflow: 'hidden',
                        backgroundColor: '#1e1e1e',
                        position: 'relative',
                        cursor: isPanning ? 'grabbing' : 'default',
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onDoubleClick={handleDoubleClick}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    <AssetProvider value={state.assets}>
                        {/* SVG Canvas */}
                        <svg
                            ref={svgRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                pointerEvents: 'none',
                            }}
                        >
                            {/* Grid background */}
                            <defs>
                                <pattern
                                    id="grid"
                                    width={20 * state.camera.zoom}
                                    height={20 * state.camera.zoom}
                                    patternUnits="userSpaceOnUse"
                                >
                                    <circle cx={1} cy={1} r={1} fill="#333" />
                                </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />

                            {/* Transform group for camera */}
                            <g transform={`translate(${state.camera.x}, ${state.camera.y}) scale(${state.camera.zoom})`}>
                                {/* Snap Lines */}
                                {snapLines.map((line, i) => (
                                    <line
                                        key={i}
                                        x1={line.type === 'vertical' ? line.position : line.start}
                                        y1={line.type === 'horizontal' ? line.position : line.start}
                                        x2={line.type === 'vertical' ? line.position : line.end}
                                        y2={line.type === 'horizontal' ? line.position : line.end}
                                        stroke="#ff0000"
                                        strokeWidth={1 / state.camera.zoom}
                                        strokeDasharray="4 4"
                                    />
                                ))}

                                {/* Render all shapes */}
                                {shapes.map(shape => {
                                    const util = defaultShapeUtils.getForShape(shape)
                                    const isSelected = state.selectedIds.has(shape.id)
                                    const isEditing = state.editingId === shape.id

                                    return (
                                        <g key={shape.id} style={{ pointerEvents: 'all' }}>
                                            {/* Render shape or editor */}
                                            {isEditing && shape.type === 'text' ? (
                                                <TextEditor key={shape.id} shape={shape as any} zoom={state.camera.zoom} editor={editor} />
                                            ) : (
                                                util.component(shape, isSelected, isEditing)
                                            )}

                                            {/* Selection and Resize Handles */}
                                            {isSelected && !isEditing && shape.type !== 'arrow' && (
                                                <>
                                                    <rect
                                                        x={shape.x - 2}
                                                        y={shape.y - 2}
                                                        width={shape.width + 4}
                                                        height={shape.height + 4}
                                                        fill="none"
                                                        stroke="#0d99ff"
                                                        strokeWidth={2 / state.camera.zoom}
                                                        strokeDasharray={`${5 / state.camera.zoom},${5 / state.camera.zoom}`}
                                                        pointerEvents="none"
                                                    />
                                                    <ResizeHandles
                                                        shape={shape}
                                                        zoom={state.camera.zoom}
                                                        onResizeStart={handleResizeStart}
                                                    />
                                                </>
                                            )}
                                        </g>
                                    )
                                })}
                                {children}
                            </g>
                        </svg>
                    </AssetProvider>
                </div>
            </div>
        </EditorProvider>
    )
}
