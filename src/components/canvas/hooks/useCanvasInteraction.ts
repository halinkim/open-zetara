import React, { useState, useEffect, useRef } from 'react'
import { Editor } from '@/lib/canvas/editor/Editor'
import { CanvasTool } from '../CanvasToolbar'
import { BaseShape, PointerShape, Shape, ConnectionAnchor } from '@/lib/canvas/shapes/types'
import { useAppStore } from '@/lib/store'
import { PointerSnapshotAsset } from '@/lib/canvas/assets/types'
import { createAssetId } from '@/lib/canvas/assets/utils'

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

export interface SnapLine {
    type: 'horizontal' | 'vertical'
    position: number
    start: number
    end: number
}

function getNearestAnchor(shape: any, point: { x: number, y: number }): ConnectionAnchor | null {
    const anchors: ConnectionAnchor[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']
    const { x, y, width, height } = shape
    const threshold = 20

    const getPos = (anchor: ConnectionAnchor) => {
        switch (anchor) {
            case 'n': return { x: x + width / 2, y }
            case 'ne': return { x: x + width, y }
            case 'e': return { x: x + width, y: y + height / 2 }
            case 'se': return { x: x + width, y: y + height }
            case 's': return { x: x + width / 2, y: y + height }
            case 'sw': return { x, y: y + height }
            case 'w': return { x, y: y + height / 2 }
            case 'nw': return { x, y }
        }
        return { x, y }
    }

    let closestAnchor: ConnectionAnchor | null = null
    let minDist = Infinity

    for (const anchor of anchors) {
        const pos = getPos(anchor)
        const dist = Math.sqrt((pos.x - point.x) ** 2 + (pos.y - point.y) ** 2)
        if (dist < threshold && dist < minDist) {
            minDist = dist
            closestAnchor = anchor
        }
    }

    return closestAnchor
}

function getSnapLines(
    shape: { x: number, y: number, width: number, height: number },
    otherShapes: Shape[]
): { lines: SnapLine[], snapX: number | null, snapY: number | null } {
    const threshold = 5
    const lines: SnapLine[] = []
    let snapX: number | null = null
    let snapY: number | null = null

    const shapeLeft = shape.x
    const shapeCenter = shape.x + shape.width / 2
    const shapeRight = shape.x + shape.width
    const shapeTop = shape.y
    const shapeMiddle = shape.y + shape.height / 2
    const shapeBottom = shape.y + shape.height

    for (const other of otherShapes) {
        const otherLeft = other.x
        const otherCenter = other.x + other.width / 2
        const otherRight = other.x + other.width
        const otherTop = other.y
        const otherMiddle = other.y + other.height / 2
        const otherBottom = other.y + other.height

        // Horizontal Snapping (Vertical Lines)
        const xTargets = [otherLeft, otherCenter, otherRight]

        for (const target of xTargets) {
            if (Math.abs(shapeLeft - target) < threshold) {
                snapX = target
                lines.push({ type: 'vertical', position: target, start: Math.min(shapeTop, otherTop), end: Math.max(shapeBottom, otherBottom) })
            } else if (Math.abs(shapeRight - target) < threshold) {
                snapX = target - shape.width
                lines.push({ type: 'vertical', position: target, start: Math.min(shapeTop, otherTop), end: Math.max(shapeBottom, otherBottom) })
            } else if (Math.abs(shapeCenter - target) < threshold) {
                snapX = target - shape.width / 2
                lines.push({ type: 'vertical', position: target, start: Math.min(shapeTop, otherTop), end: Math.max(shapeBottom, otherBottom) })
            }
        }

        // Vertical Snapping (Horizontal Lines)
        const yTargets = [otherTop, otherMiddle, otherBottom]

        for (const target of yTargets) {
            if (Math.abs(shapeTop - target) < threshold) {
                snapY = target
                lines.push({ type: 'horizontal', position: target, start: Math.min(shapeLeft, otherLeft), end: Math.max(shapeRight, otherRight) })
            } else if (Math.abs(shapeBottom - target) < threshold) {
                snapY = target - shape.height
                lines.push({ type: 'horizontal', position: target, start: Math.min(shapeLeft, otherLeft), end: Math.max(shapeRight, otherRight) })
            } else if (Math.abs(shapeMiddle - target) < threshold) {
                snapY = target - shape.height / 2
                lines.push({ type: 'horizontal', position: target, start: Math.min(shapeLeft, otherLeft), end: Math.max(shapeRight, otherRight) })
            }
        }
    }

    return { lines, snapX, snapY }
}

function getPointSnapLines(
    point: { x: number, y: number },
    otherShapes: Shape[]
): { lines: SnapLine[], snapX: number | null, snapY: number | null } {
    const threshold = 5
    const lines: SnapLine[] = []
    let snapX: number | null = null
    let snapY: number | null = null

    for (const other of otherShapes) {
        const otherLeft = other.x
        const otherCenter = other.x + other.width / 2
        const otherRight = other.x + other.width
        const otherTop = other.y
        const otherMiddle = other.y + other.height / 2
        const otherBottom = other.y + other.height

        // Horizontal Snapping (Vertical Lines)
        const xTargets = [otherLeft, otherCenter, otherRight]
        for (const target of xTargets) {
            if (Math.abs(point.x - target) < threshold) {
                snapX = target
                lines.push({ type: 'vertical', position: target, start: Math.min(point.y, otherTop), end: Math.max(point.y, otherBottom) })
            }
        }

        // Vertical Snapping (Horizontal Lines)
        const yTargets = [otherTop, otherMiddle, otherBottom]
        for (const target of yTargets) {
            if (Math.abs(point.y - target) < threshold) {
                snapY = target
                lines.push({ type: 'horizontal', position: target, start: Math.min(point.x, otherLeft), end: Math.max(point.x, otherRight) })
            }
        }
    }

    return { lines, snapX, snapY }
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
    const [drawingArrow, setDrawingArrow] = useState<{ id: string, startBinding?: any } | null>(null)
    const [erasing, setErasing] = useState(false)
    const [draggingHandle, setDraggingHandle] = useState<{ shapeId: string, handle: 'start' | 'end' } | null>(null)
    const [snapLines, setSnapLines] = useState<SnapLine[]>([])
    const { setNavigationTarget } = useAppStore()
    const batchStarted = useRef(false)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const handleWheel = (e: WheelEvent) => {
            // Zoom (Mouse wheel only)
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()

            const rect = container.getBoundingClientRect()
            const mouseX = e.clientX - rect.left
            const mouseY = e.clientY - rect.top

            const camera = editor.getCamera()
            const delta = -e.deltaY * 0.001
            const newZoom = Math.min(Math.max(camera.zoom + delta, 0.1), 5)

            // Calculate world point under mouse before zoom
            const worldX = (mouseX - camera.x) / camera.zoom
            const worldY = (mouseY - camera.y) / camera.zoom

            // Calculate new camera position to keep world point under mouse
            // mouseX = newCameraX + worldX * newZoom
            // newCameraX = mouseX - worldX * newZoom
            const newX = mouseX - worldX * newZoom
            const newY = mouseY - worldY * newZoom

            editor.setCamera({
                x: newX,
                y: newY,
                zoom: newZoom,
            })
        }

        container.addEventListener('wheel', handleWheel, { passive: false })

        return () => {
            container.removeEventListener('wheel', handleWheel)
        }
    }, [editor, containerRef])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return

        // Pan with middle mouse button (keep this as backup)
        if (e.button === 1) {
            e.preventDefault()
            setIsPanning(true)
            setPanStart({ x: e.clientX, y: e.clientY })
            return
        }

        // Only handle left click for tools
        if (e.button !== 0) return

        // Start history batch
        editor.startBatch('interaction')
        batchStarted.current = true

        // Check for handle click
        const target = e.target as HTMLElement | SVGElement
        const handle = target.getAttribute('data-handle')
        const shapeId = target.getAttribute('data-shape-id')

        if (handle && shapeId && (handle === 'start' || handle === 'end')) {
            setDraggingHandle({ shapeId, handle: handle as 'start' | 'end' })
            setIsPanning(false)
            return
        }

        // Always exit editing mode on click (unless double click handled separately)
        editor.setEditingShape(null)

        const rect = containerRef.current.getBoundingClientRect()
        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const worldPoint = editor.screenToWorld(screenPoint)

        // Check for resize handle
        const resizeHandle = target.getAttribute('data-resize-handle')
        if (resizeHandle && editor.getSelectedShapeIds().length === 1) {
            const shape = editor.getSelectedShapes()[0]
            setResizing({
                shapeId: shape.id,
                handle: resizeHandle,
                startX: worldPoint.x,
                startY: worldPoint.y,
                initialBounds: { x: shape.x, y: shape.y, width: shape.width, height: shape.height }
            })
            return
        }

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

        if (currentTool === 'arrow' || currentTool === 'line') {
            // Check for start binding
            const hitShape = editor.getShapeAtPoint(worldPoint)
            let startBinding = undefined
            if (hitShape) {
                const anchor = getNearestAnchor(hitShape, worldPoint)
                if (anchor) {
                    startBinding = { shapeId: hitShape.id, anchor }
                }
            }

            const shape = editor.createShape('arrow', {
                x: worldPoint.x,
                y: worldPoint.y,
                props: {
                    start: { x: 0, y: 0 },
                    end: { x: 0, y: 0 },
                    startBinding,
                    arrowheadEnd: currentTool === 'arrow' ? 'arrow' : 'none',
                    strokeWidth: 2,
                    bend: 0,
                    arrowheadStart: 'none'
                }
            })
            setDrawingArrow({ id: shape.id, startBinding })
            return
        }

        if (currentTool === 'eraser') {
            setErasing(true)
            const hitShape = editor.getShapeAtPoint(worldPoint)
            if (hitShape) {
                editor.deleteShapes([hitShape.id])
            }
            return
        }

        // Hit test for selection
        const hitShape = editor.getShapeAtPoint(worldPoint)

        if (hitShape) {
            if (currentTool === 'select') {
                if (e.shiftKey || e.ctrlKey) {
                    editor.toggleSelection(hitShape.id)
                } else {
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
            if (currentTool === 'select') {
                // Clear selection
                if (!e.shiftKey && !e.ctrlKey) {
                    editor.selectNone()
                }

                // Start panning
                setIsPanning(true)
                setPanStart({ x: e.clientX, y: e.clientY })
            }
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        const camera = editor.getCamera()
        const rect = containerRef.current.getBoundingClientRect()
        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const worldPoint = editor.screenToWorld(screenPoint)

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

        // Handle handle dragging
        if (draggingHandle) {
            const shape = editor.getShape(draggingHandle.shapeId)
            if (shape && shape.type === 'arrow') {
                const otherShapes = editor.getShapes().filter(s => s.id !== shape.id)
                const { lines, snapX, snapY } = getPointSnapLines(worldPoint, otherShapes)

                let newX = worldPoint.x
                let newY = worldPoint.y

                if (snapX !== null) newX = snapX
                if (snapY !== null) newY = snapY
                setSnapLines(lines)

                const relativePoint = {
                    x: newX - shape.x,
                    y: newY - shape.y
                }
                editor.updateShape(shape.id, {
                    props: {
                        ...shape.props,
                        [draggingHandle.handle]: relativePoint
                    }
                })
            }
            return
        }

        // Handle arrow drawing
        if (drawingArrow) {
            // Check for end binding
            const hitShape = editor.getShapeAtPoint(worldPoint)
            let endBinding = undefined
            if (hitShape && hitShape.id !== drawingArrow.id) {
                const anchor = getNearestAnchor(hitShape, worldPoint)
                if (anchor) {
                    endBinding = { shapeId: hitShape.id, anchor }
                }
            }

            const shape = editor.getShape(drawingArrow.id)
            if (shape && shape.type === 'arrow') {
                editor.updateShape(drawingArrow.id, {
                    props: {
                        ...shape.props,
                        end: {
                            x: worldPoint.x - shape.x,
                            y: worldPoint.y - shape.y
                        },
                        endBinding
                    }
                })
            }
            return
        }

        // Handle erasing
        if (erasing) {
            const hitShape = editor.getShapeAtPoint(worldPoint)
            if (hitShape) {
                editor.deleteShapes([hitShape.id])
            }
            return
        }

        // Handle resizing
        if (resizing) {
            const dx = worldPoint.x - resizing.startX
            const dy = worldPoint.y - resizing.startY
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

            let newX = draggedShape.initialX + dx
            let newY = draggedShape.initialY + dy

            // Snap logic
            const otherShapes = editor.getShapes().filter(s => s.id !== draggedShape.shapeId)
            const currentShape = editor.getShape(draggedShape.shapeId)

            if (currentShape) {
                const { lines, snapX, snapY } = getSnapLines(
                    { x: newX, y: newY, width: currentShape.width, height: currentShape.height },
                    otherShapes
                )

                if (snapX !== null) newX = snapX
                if (snapY !== null) newY = snapY
                setSnapLines(lines)
            } else {
                setSnapLines([])
            }

            editor.updateShape(draggedShape.shapeId, {
                x: newX,
                y: newY,
            })
        }
    }

    const handleMouseUp = () => {
        if (batchStarted.current) {
            editor.endBatch('interaction')
            batchStarted.current = false
        }

        setIsPanning(false)
        setDraggedShape(null)
        setResizing(null)
        setSnapLines([])
        setDraggingHandle(null)

        if (drawingArrow) {
            const shape = editor.getShape(drawingArrow.id)
            if (shape && shape.type === 'arrow') {
                const start = shape.props.start || { x: 0, y: 0 }
                const end = shape.props.end || { x: 0, y: 0 }
                const dist = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2)
                if (dist < 10) {
                    editor.deleteShapes([shape.id])
                }
            }
            setDrawingArrow(null)
            setCurrentTool('select')
        }

        if (erasing) {
            setErasing(false)
        }
    }

    const handleResizeStart = (e: React.MouseEvent, handle: string, shape: BaseShape<any, any>) => {
        e.stopPropagation()
        // This is now handled in handleMouseDown via data-resize-handle
    }

    const handleDoubleClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const worldPoint = editor.screenToWorld(screenPoint)

        const hitShape = editor.getShapeAtPoint(worldPoint)
        if (hitShape && hitShape.type === 'text') {
            editor.setEditingShape(hitShape.id)
        } else if (hitShape && hitShape.type === 'pointer') {
            // Navigate to PDF location
            const asset = editor.getAsset(hitShape.props.assetId)
            if (asset && asset.type === 'pointer-snapshot') {
                setNavigationTarget({
                    pdfId: asset.meta.pdfId,
                    page: asset.meta.page,
                })
            }
        } else if (!hitShape) {
            // Create text on double click
            editor.createShape('text', {
                x: worldPoint.x,
                y: worldPoint.y,
                width: 200,
                height: 100,
            })
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const screenPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top }
        const worldPoint = editor.screenToWorld(screenPoint)

        // Handle PDF snapshots
        const pointerData = e.dataTransfer.getData('application/zetara-pointer')
        if (pointerData) {
            try {
                const data = JSON.parse(pointerData)
                console.log('Dropped pointer data:', data)

                if (data.image && data.rect) {
                    // Create asset for the snapshot
                    const assetId = createAssetId()
                    editor.createAsset({
                        id: assetId,
                        type: 'pointer-snapshot',
                        src: data.image,
                        width: data.rect.width,
                        height: data.rect.height,
                        meta: {
                            pdfId: data.pdfId,
                            page: data.page,
                            rect: data.rect,
                        },
                    })

                    // Create pointer shape
                    editor.createShape('pointer', {
                        x: worldPoint.x,
                        y: worldPoint.y,
                        width: data.rect.width,
                        height: data.rect.height,
                        props: {
                            assetId,
                        },
                    })
                }
            } catch (err) {
                console.error('Failed to parse pointer data:', err)
            }
            return
        }

        // Handle library items
        const libraryData = e.dataTransfer.getData('application/x-tldraw-library')
        if (libraryData) {
            try {
                const item = JSON.parse(libraryData)
                // Create shapes from library item
                // ...
            } catch (err) {
                console.error('Failed to parse library item', err)
            }
            return
        }

        // Handle files (images, PDFs)
        if (e.dataTransfer.files.length > 0) {
            // ... file handling ...
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
        handleDrop,
        snapLines
    }
}
