/**
 * CanvasBoard2 - New implementation using Editor and ShapeUtil
 * 
 * This is a cleaner rewrite of CanvasBoard that uses the new architecture.
 * Maintains backward compatibility through data migration.
 */

'use client'

import React, { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { db } from '@/db/schema'
import { useEditor, useEditorState } from '@/lib/canvas/editor'
import { migrateOldToNew, migrateNewToOld } from '@/lib/canvas/migration'
import { CanvasToolbar, CanvasTool } from './CanvasToolbar'
import { defaultShapeUtils } from '@/lib/canvas/shapeUtils'

export function CanvasBoard2() {
    const editor = useEditor()
    const state = useEditorState(editor)
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const { selectedPaperId, setNavigationTarget, setSelectedPaperId } = useAppStore()
    const [currentTool, setCurrentTool] = React.useState<CanvasTool>('select')
    const [isPanning, setIsPanning] = React.useState(false)
    const [panStart, setPanStart] = React.useState({ x: 0, y: 0 })
    const [draggedShape, setDraggedShape] = React.useState<{
        shapeId: string
        startX: number
        startY: number
        initialX: number
        initialY: number
    } | null>(null)

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
    }, [selectedPaperId])

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
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if editing
            const activeElement = document.activeElement as HTMLElement
            const isInputFocused = activeElement && (
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'INPUT' ||
                (activeElement as any).isContentEditable
            )

            if (isInputFocused || state.editingId) return

            // Delete selected shapes
            if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedIds.size > 0) {
                e.preventDefault()
                editor.deleteShapes(Array.from(state.selectedIds))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [state.editingId, state.selectedIds, editor])

    // Handle wheel for zoom/pan with native event listener
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                // Zoom
                e.preventDefault()
                const delta = -e.deltaY * 0.001
                const camera = editor.getCamera()
                editor.setCamera({
                    zoom: Math.min(Math.max(camera.zoom + delta, 0.1), 5),
                })
            } else {
                // Pan
                e.preventDefault()
                const camera = editor.getCamera()
                editor.setCamera({
                    x: camera.x - e.deltaX,
                    y: camera.y - e.deltaY,
                })
            }
        }

        // Add non-passive event listener to allow preventDefault
        container.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            container.removeEventListener('wheel', handleWheel)
        }
    }, [editor])

    // Handle mouse events
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return

        // Pan with Alt+click or middle mouse button
        if (e.altKey || e.button === 1) {
            e.preventDefault()
            setIsPanning(true)
            setPanStart({ x: e.clientX, y: e.clientY })
            return
        }

        // Only handle left click for tools
        if (e.button !== 0) return

        const rect = containerRef.current.getBoundingClientRect()
        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const worldPoint = editor.screenToWorld(screenPoint)

        console.log('Mouse down:', { currentTool, screenPoint, worldPoint })

        // Handle tool-specific actions
        if (currentTool === 'text') {
            console.log('Creating text shape')
            const shape = editor.createShape('text', {
                x: worldPoint.x,
                y: worldPoint.y,
                width: 200,
                height: 100,
            })
            console.log('Created shape:', shape)
            setCurrentTool('select')
            return
        }

        if (currentTool === 'rect') {
            console.log('Creating rect shape')
            const shape = editor.createShape('rect', {
                x: worldPoint.x,
                y: worldPoint.y,
                width: 100,
                height: 100,
            })
            console.log('Created shape:', shape)
            setCurrentTool('select')
            return
        }

        if (currentTool === 'circle') {
            console.log('Creating circle shape')
            const shape = editor.createShape('circle', {
                x: worldPoint.x,
                y: worldPoint.y,
                width: 100,
                height: 100,
            })
            console.log('Created shape:', shape)
            setCurrentTool('select')
            return
        }

        // Hit test for selection
        const hitShape = editor.getShapeAtPoint(worldPoint)
        console.log('Hit test:', { worldPoint, hitShape, allShapes: shapes.length })

        if (hitShape) {
            console.log('Selecting shape:', hitShape.id)
            editor.setSelection([hitShape.id])

            // Start dragging if in select mode
            if (currentTool === 'select') {
                setDraggedShape({
                    shapeId: hitShape.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    initialX: hitShape.x,
                    initialY: hitShape.y,
                })
            }
        } else {
            console.log('Clearing selection')
            editor.selectNone()
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        // Handle panning
        if (isPanning) {
            const dx = e.clientX - panStart.x
            const dy = e.clientY - panStart.y

            const camera = editor.getCamera()
            editor.setCamera({
                x: camera.x + dx,
                y: camera.y + dy,
            })

            setPanStart({ x: e.clientX, y: e.clientY })
            return
        }

        // Handle shape dragging
        if (draggedShape) {
            const dx = (e.clientX - draggedShape.startX) / state.camera.zoom
            const dy = (e.clientY - draggedShape.startY) / state.camera.zoom

            editor.updateShape(draggedShape.shapeId, {
                x: draggedShape.initialX + dx,
                y: draggedShape.initialY + dy,
            })
        }
    }

    const handleMouseUp = () => {
        setIsPanning(false)
        setDraggedShape(null)
    }



    const shapes = Object.values(state.shapes)

    return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <CanvasToolbar currentTool={currentTool} onToolChange={setCurrentTool} />

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
            >
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
                        {/* Render all shapes */}
                        {shapes.map(shape => {
                            const util = defaultShapeUtils.getForShape(shape)
                            const isSelected = state.selectedIds.has(shape.id)
                            const isEditing = state.editingId === shape.id

                            return (
                                <g key={shape.id} style={{ pointerEvents: 'all' }}>
                                    {util.component(shape, isSelected, isEditing)}
                                    {isSelected && (
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
                                    )}
                                </g>
                            )
                        })}
                    </g>
                </svg>
            </div>
        </div>
    )
}
