import React, { useEffect, useRef } from 'react'
import { useEditor, useEditorState } from '@/lib/canvas/editor'
import { db } from '@/db/schema'
import { useAppStore } from '@/lib/store'
import { migrateOldToNew, migrateNewToOld } from '@/lib/canvas/migration'
import { CanvasToolbar, CanvasTool } from './CanvasToolbar'
import { defaultShapeUtils } from '@/lib/canvas/shapeUtils'
import { ResizeHandles } from './ResizeHandles'
import { TextEditor } from './TextEditor'
import { useCanvasInteraction } from './hooks/useCanvasInteraction'
import { AssetProvider } from '@/lib/canvas/context/AssetContext'
import { EditorProvider } from '@/lib/canvas/context/EditorContext'
import { StylePanel } from './StylePanel'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export function CanvasBoard2() {
    const editor = useEditor()
    const state = useEditorState(editor)
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const { selectedPaperId } = useAppStore()
    const [currentTool, setCurrentTool] = React.useState<CanvasTool>('select')

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
    } = useCanvasInteraction(editor, containerRef, currentTool, setCurrentTool)

    // Load canvas data when paper changes
    useEffect(() => {
        if (!selectedPaperId) {
            return
        }

        const loadCanvas = async () => {
            try {
                const canvas = await db.canvases.where('paperId').equals(selectedPaperId).first()

                if (canvas && canvas.elements) {
                    // Parse old format
                    const oldItems = JSON.parse(canvas.elements)

                    // Convert to new format
                    const { shapes, assets } = migrateOldToNew(oldItems)

                    // Load into editor
                    editor.setState({
                        shapes,
                        assets,
                        selectedIds: new Set(),
                        editingId: null,
                        camera: state.camera, // Keep current camera
                    })
                }
            } catch (error) {
                console.error('Error loading canvas:', error)
            }
        }

        loadCanvas()
    }, [selectedPaperId, editor])

    // Save canvas data when it changes
    useEffect(() => {
        if (!selectedPaperId) return

        const saveCanvas = async () => {
            try {
                // Convert shapes back to old format
                const oldItems = migrateNewToOld(state.shapes, state.assets)

                const existing = await db.canvases.where('paperId').equals(selectedPaperId).first()
                const data = {
                    paperId: selectedPaperId,
                    elements: JSON.stringify(oldItems),
                    updatedAt: Date.now(),
                }

                if (existing && existing.id) {
                    await db.canvases.update(existing.id, data)
                } else {
                    await db.canvases.add(data)
                }
            } catch (error) {
                console.error('Error saving canvas:', error)
            }
        }

        // Debounce saves
        const timeoutId = setTimeout(saveCanvas, 1000)
        return () => clearTimeout(timeoutId)
    }, [state.shapes, state.assets, selectedPaperId])

    // Handle keyboard shortcuts
    // Handle keyboard shortcuts
    useKeyboardShortcuts(editor)

    const shapes = Object.values(state.shapes).sort((a, b) => (a.index || 0) - (b.index || 0))

    return (
        <EditorProvider value={editor}>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Toolbar */}
                <CanvasToolbar currentTool={currentTool} onToolChange={setCurrentTool} />

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
                            </g>
                        </svg>
                    </AssetProvider>
                </div>
            </div>
        </EditorProvider>
    )
}
