import React, { useState, useEffect } from 'react'
import { Editor } from '@/lib/canvas/editor/Editor'
import { CanvasTool } from '../CanvasToolbar'
import { BaseShape, PointerShape, Shape } from '@/lib/canvas/shapes/types'
import { useAppStore } from '@/lib/store'
import { PointerSnapshotAsset } from '@/lib/canvas/assets/types'

interface DragState {
    shapeId: string
    startX: number
    startY: number
    initialX: number
    initialY: number
}

interface ResizeState {
    shapeId: string
    handle: string
    startX: number
    startY: number
    initialBounds: { x: number; y: number; width: number; height: number }
}

export function useCanvasInteraction(
    editor: Editor,
    containerRef: React.RefObject<HTMLDivElement | null>,
    currentTool: CanvasTool,
    setCurrentTool: (tool: CanvasTool) => void
) {
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })
    const [draggedShape, setDraggedShape] = useState<DragState | null>(null)
    const [resizing, setResizing] = useState<ResizeState | null>(null)
    const { setNavigationTarget } = useAppStore()

    // Handle wheel for zoom/pan
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e: any) => {
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

        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [editor, containerRef])

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

        // Always exit editing mode on click (unless double click handled separately)
        editor.setEditingShape(null)

        const rect = containerRef.current.getBoundingClientRect()
        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const worldPoint = editor.screenToWorld(screenPoint)

        // Handle tool-specific actions
        if (currentTool === 'text') {
            editor.createShape('text', {
                x: worldPoint.x,
                y: worldPoint.y,
                width: 200,
                height: 100,
            })
            setCurrentTool('select')
            return
        }

        if (currentTool === 'rect') {
            editor.createShape('rect', {
                x: worldPoint.x,
                y: worldPoint.y,
                width: 100,
                height: 100,
            })
            setCurrentTool('select')
            return
        }

        if (currentTool === 'circle') {
            editor.createShape('circle', {
                x: worldPoint.x,
                y: worldPoint.y,
                width: 100,
                height: 100,
            })
            setCurrentTool('select')
            return
        }

        // Hit test for selection
        const hitShape = editor.getShapeAtPoint(worldPoint)

        if (hitShape) {
            if (currentTool === 'select') {
                if (e.shiftKey || e.ctrlKey) {
                    editor.toggleSelection(hitShape.id)
                } else {
                    // If clicking an unselected shape without modifiers, select only that shape
                    // If clicking a selected shape, keep selection (for dragging multiple)
                    if (!editor.getSelectedShapeIds().includes(hitShape.id)) {
                        editor.setSelection([hitShape.id])
                    }
                }

                // Start dragging
                setDraggedShape({
                    shapeId: hitShape.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    initialX: hitShape.x,
                    initialY: hitShape.y,
                })
            }
        } else {
            // Clicked on empty space
            if (!e.shiftKey && !e.ctrlKey) {
                editor.selectNone()
            }
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        const camera = editor.getCamera()

        // Handle panning
        if (isPanning) {
            const dx = e.clientX - panStart.x
            const dy = e.clientY - panStart.y

            editor.setCamera({
                x: camera.x + dx,
                y: camera.y + dy,
            })

            setPanStart({ x: e.clientX, y: e.clientY })
            return
        }

        // Handle resizing
        if (resizing) {
            const dx = (e.clientX - resizing.startX) / camera.zoom
            const dy = (e.clientY - resizing.startY) / camera.zoom
            const { handle, initialBounds } = resizing

            let newX = initialBounds.x
            let newY = initialBounds.y
            let newWidth = initialBounds.width
            let newHeight = initialBounds.height

            // Adjust based on handle
            if (handle.includes('w')) {
                newX = initialBounds.x + dx
                newWidth = initialBounds.width - dx
            } else if (handle.includes('e')) {
                newWidth = initialBounds.width + dx
            }

            if (handle.includes('n')) {
                newY = initialBounds.y + dy
                newHeight = initialBounds.height - dy
            } else if (handle.includes('s')) {
                newHeight = initialBounds.height + dy
            }

            // Apply Shift constraint
            if (e.shiftKey) {
                const shape = editor.getShape(resizing.shapeId)
                if (shape) {
                    let targetRatio: number | null = null
                    if (shape.type === 'pointer') {
                        targetRatio = initialBounds.width / initialBounds.height
                    } else if (shape.type === 'rect' || shape.type === 'circle') {
                        targetRatio = 1
                    }

                    if (targetRatio !== null && handle.length === 2) {
                        if (newWidth / newHeight > targetRatio) {
                            newHeight = newWidth / targetRatio
                        } else {
                            newWidth = newHeight * targetRatio
                        }
                    }
                }
            }

            // Minimum size
            if (newWidth < 20) newWidth = 20
            if (newHeight < 20) newHeight = 20

            // Update if width changed and we're on west side
            if (handle.includes('w') && newWidth !== initialBounds.width) {
                newX = initialBounds.x + initialBounds.width - newWidth
            }
            if (handle.includes('n') && newHeight !== initialBounds.height) {
                newY = initialBounds.y + initialBounds.height - newHeight
            }

            editor.updateShape(resizing.shapeId, {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
            })
            return
        }

        // Handle shape dragging
        if (draggedShape) {
            const dx = (e.clientX - draggedShape.startX) / camera.zoom
            const dy = (e.clientY - draggedShape.startY) / camera.zoom

            editor.updateShape(draggedShape.shapeId, {
                x: draggedShape.initialX + dx,
                y: draggedShape.initialY + dy,
            })
        }
    }

    const handleMouseUp = () => {
        setIsPanning(false)
        setDraggedShape(null)
        setResizing(null)
    }

    const handleResizeStart = (e: React.MouseEvent, handle: string, shape: BaseShape<any, any>) => {
        e.stopPropagation()
        setResizing({
            shapeId: shape.id,
            handle,
            startX: e.clientX,
            startY: e.clientY,
            initialBounds: {
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
            },
        })
    }

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const worldPoint = editor.screenToWorld(screenPoint)

        const hitShape = editor.getShapeAtPoint(worldPoint)
        if (hitShape) {
            // Text editing
            if (hitShape.type === 'text') {
                editor.setEditingShape(hitShape.id)
            }
            // PDF Navigation
            else if (hitShape.type === 'pointer') {
                const pointerShape = hitShape as PointerShape
                const asset = editor.getAsset(pointerShape.props.assetId) as PointerSnapshotAsset

                if (asset && asset.type === 'pointer-snapshot') {
                    setNavigationTarget({
                        pdfId: asset.meta.pdfId,
                        page: asset.meta.page,
                        rect: asset.meta.rect
                    })
                }
            }
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        const data = e.dataTransfer.getData('application/zetara-pointer')
        if (!data) return

        try {
            const payload = JSON.parse(data)
            if (payload.type === 'pointer') {
                const rect = containerRef.current?.getBoundingClientRect()
                if (!rect) return

                const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
                const worldPoint = editor.screenToWorld(screenPoint)

                // Create Asset
                const assetId = `asset:${crypto.randomUUID()}`
                // Calculate aspect ratio
                const aspectRatio = payload.rect.width / payload.rect.height
                const width = 200
                const height = width / aspectRatio

                const asset: PointerSnapshotAsset = {
                    id: assetId,
                    type: 'pointer-snapshot',
                    src: payload.image,
                    width: payload.rect.width,
                    height: payload.rect.height,
                    meta: {
                        pdfId: payload.pdfId,
                        page: payload.page,
                        rect: payload.rect
                    }
                }
                editor.createAsset(asset)

                // Create Shape
                editor.createShape('pointer', {
                    x: worldPoint.x,
                    y: worldPoint.y,
                    width: width,
                    height: height,
                    props: {
                        assetId: assetId
                    }
                })
            }
        } catch (err) {
            console.error('Failed to parse drop data', err)
        }
    }

    return {
        isPanning,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleResizeStart,
        handleDoubleClick,
        handleDragOver,
        handleDrop
    }
}
