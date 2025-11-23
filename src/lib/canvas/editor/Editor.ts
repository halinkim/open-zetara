/**
 * Canvas Editor
 * 
 * Central API for all canvas operations. Manages state, shapes, assets,
 * selection, and camera. Similar to tldraw's Editor but simplified.
 */

import { Shape, ShapeId, ShapeType, createShape as createShapeHelper } from '../shapes'
import { Asset, AssetId } from '../assets'
import { CanvasState, Camera, createEmptyCanvasState, serializeCanvasState, deserializeCanvasState } from '../store'
import { ShapeUtil, ShapeUtilRegistry, defaultShapeUtils } from '../shapeUtils'
import { Vec2, Bounds } from '../shapes/types'
import { HistoryManager } from './managers/HistoryManager'
import { captureEditorState, restoreEditorState, EditorStateSnapshot, areStatesEqual } from './utils/history-utils'
import { copyShapesToClipboard, pasteShapesFromClipboard } from './clipboard'

export class Editor {
    private state: CanvasState
    private shapeUtils: ShapeUtilRegistry
    private listeners: Set<() => void> = new Set()
    private history: HistoryManager

    constructor(
        initialState?: Partial<CanvasState>,
        shapeUtils?: ShapeUtilRegistry
    ) {
        this.state = {
            ...createEmptyCanvasState(),
            ...initialState,
        }
        this.shapeUtils = shapeUtils || defaultShapeUtils
        this.history = new HistoryManager({ maxStackSize: 100 })
    }

    // ============================================================================
    // State Access
    // ============================================================================

    getState(): CanvasState {
        return this.state
    }

    setState(partial: Partial<CanvasState>): void {
        this.state = { ...this.state, ...partial }
        this.notifyListeners()
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener())
    }

    // ============================================================================
    // Shape Operations
    // ============================================================================

    getShape(id: ShapeId): Shape | undefined {
        return this.state.shapes[id]
    }

    getShapes(): Shape[] {
        return Object.values(this.state.shapes)
    }

    createShape<T extends ShapeType>(
        type: T,
        partial: Partial<Omit<Extract<Shape, { type: T }>, 'id' | 'type' | 'props' | 'meta'>> & {
            props?: Partial<Extract<Shape, { type: T }>['props']>
        } = {}
    ): Extract<Shape, { type: T }> {
        const before = this.captureState()

        const maxIndex = Math.max(0, ...Object.values(this.state.shapes).map(s => s.index || 0))
        const shape = createShapeHelper(type, { ...partial, index: maxIndex + 1 } as any)
        this.state.shapes[shape.id] = shape as Shape

        const after = this.captureState()
        this.recordHistory(before, after, 'Create shape')

        this.notifyListeners()
        return shape as Extract<Shape, { type: T }>
    }

    updateShape(id: ShapeId, partial: Partial<Shape>): void {
        const shape = this.state.shapes[id]
        if (!shape) return

        const before = this.captureState()
        this.state.shapes[id] = { ...shape, ...partial } as Shape
        const after = this.captureState()
        this.recordHistory(before, after, 'Update shape')

        this.notifyListeners()
    }

    updateShapes(updates: { id: ShapeId, partial: Partial<Shape> }[]): void {
        if (updates.length === 0) return

        const before = this.captureState()

        let changed = false
        updates.forEach(({ id, partial }) => {
            const shape = this.state.shapes[id]
            if (shape) {
                this.state.shapes[id] = { ...shape, ...partial } as Shape
                changed = true
            }
        })

        if (changed) {
            const after = this.captureState()
            this.recordHistory(before, after, 'Update shapes')
            this.notifyListeners()
        }
    }

    deleteShape(id: ShapeId): void {
        delete this.state.shapes[id]
        // Remove from selection if selected
        this.state.selectedIds.delete(id)
        // Clear editing if this was being edited
        if (this.state.editingId === id) {
            this.state.editingId = null
        }
        this.notifyListeners()
    }

    deleteShapes(ids: ShapeId[]): void {
        if (ids.length === 0) return

        const before = this.captureState()

        ids.forEach(id => {
            delete this.state.shapes[id]
            this.state.selectedIds.delete(id)
        })
        if (this.state.editingId && ids.includes(this.state.editingId)) {
            this.state.editingId = null
        }

        const after = this.captureState()
        this.recordHistory(before, after, 'Delete shapes')

        this.notifyListeners()
    }

    // ============================================================================
    // Selection
    // ============================================================================

    getSelectedShapes(): Shape[] {
        return Array.from(this.state.selectedIds)
            .map(id => this.state.shapes[id])
            .filter(Boolean)
    }

    getSelectedShapeIds(): ShapeId[] {
        return Array.from(this.state.selectedIds)
    }

    setSelection(ids: ShapeId[]): void {
        this.state.selectedIds = new Set(ids)
        this.notifyListeners()
    }

    selectNone(): void {
        this.state.selectedIds.clear()
        this.notifyListeners()
    }

    selectAll(): void {
        this.state.selectedIds = new Set(Object.keys(this.state.shapes))
        this.notifyListeners()
    }

    toggleSelection(id: ShapeId): void {
        if (this.state.selectedIds.has(id)) {
            this.state.selectedIds.delete(id)
        } else {
            this.state.selectedIds.add(id)
        }
        this.notifyListeners()
    }

    sendBackward(ids: ShapeId[]): void {
        if (ids.length === 0) return

        const before = this.captureState()

        const shapes = this.getShapes().sort((a, b) => (a.index || 0) - (b.index || 0))
        const selectedSet = new Set(ids)

        for (let i = 1; i < shapes.length; i++) {
            if (selectedSet.has(shapes[i].id) && !selectedSet.has(shapes[i - 1].id)) {
                const temp = shapes[i].index
                shapes[i].index = shapes[i - 1].index
                shapes[i - 1].index = temp

                this.state.shapes[shapes[i].id] = shapes[i]
                this.state.shapes[shapes[i - 1].id] = shapes[i - 1]
            }
        }

        const after = this.captureState()
        this.recordHistory(before, after, 'Send backward')

        this.notifyListeners()
    }

    bringForward(ids: ShapeId[]): void {
        if (ids.length === 0) return

        const before = this.captureState()

        const shapes = this.getShapes().sort((a, b) => (a.index || 0) - (b.index || 0))
        const selectedSet = new Set(ids)

        for (let i = shapes.length - 2; i >= 0; i--) {
            if (selectedSet.has(shapes[i].id) && !selectedSet.has(shapes[i + 1].id)) {
                const temp = shapes[i].index
                shapes[i].index = shapes[i + 1].index
                shapes[i + 1].index = temp

                this.state.shapes[shapes[i].id] = shapes[i]
                this.state.shapes[shapes[i + 1].id] = shapes[i + 1]
            }
        }

        const after = this.captureState()
        this.recordHistory(before, after, 'Bring forward')

        this.notifyListeners()
    }

    /**
     * Bring shapes to front (highest z-index)
     */
    bringToFront(ids: ShapeId[]): void {
        if (ids.length === 0) return

        const before = this.captureState()

        const shapes = this.getShapes().sort((a, b) => (a.index || 0) - (b.index || 0))
        const selectedSet = new Set(ids)

        // Find max index
        const maxIndex = Math.max(...shapes.map(s => s.index || 0))

        // Move selected shapes to front
        let newIndex = maxIndex + 1
        for (const shape of shapes) {
            if (selectedSet.has(shape.id)) {
                shape.index = newIndex++
                this.state.shapes[shape.id] = shape
            }
        }

        const after = this.captureState()
        this.recordHistory(before, after, 'Bring to front')

        this.notifyListeners()
    }

    /**
     * Send shapes to back (lowest z-index)
     */
    sendToBack(ids: ShapeId[]): void {
        if (ids.length === 0) return

        const before = this.captureState()

        const shapes = this.getShapes().sort((a, b) => (a.index || 0) - (b.index || 0))
        const selectedSet = new Set(ids)

        // Find min index
        const minIndex = Math.min(...shapes.map(s => s.index || 0))

        // Shift non-selected shapes up
        const selectedShapes = shapes.filter(s => selectedSet.has(s.id))
        const nonSelectedShapes = shapes.filter(s => !selectedSet.has(s.id))

        // Move non-selected shapes up by the number of selected shapes
        for (const shape of nonSelectedShapes) {
            shape.index = (shape.index || 0) + selectedShapes.length
            this.state.shapes[shape.id] = shape
        }

        // Place selected shapes at the bottom
        let newIndex = minIndex
        for (const shape of selectedShapes) {
            shape.index = newIndex++
            this.state.shapes[shape.id] = shape
        }

        const after = this.captureState()
        this.recordHistory(before, after, 'Send to back')

        this.notifyListeners()
    }

    // ============================================================================
    // Editing
    // ============================================================================

    getEditingShapeId(): ShapeId | null {
        return this.state.editingId
    }

    setEditingShape(id: ShapeId | null): void {
        this.state.editingId = id
        this.notifyListeners()
    }

    // ============================================================================
    // Camera
    // ============================================================================

    getCamera(): Camera {
        return this.state.camera
    }

    setCamera(partial: Partial<Camera>): void {
        this.state.camera = { ...this.state.camera, ...partial }
        this.notifyListeners()
    }

    zoomIn(): void {
        this.state.camera.zoom = Math.min(this.state.camera.zoom * 1.2, 5)
        this.notifyListeners()
    }

    zoomOut(): void {
        this.state.camera.zoom = Math.max(this.state.camera.zoom / 1.2, 0.1)
        this.notifyListeners()
    }

    resetZoom(): void {
        this.state.camera.zoom = 1
        this.notifyListeners()
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(point: Vec2): Vec2 {
        const { camera } = this.state
        return {
            x: (point.x - camera.x) / camera.zoom,
            y: (point.y - camera.y) / camera.zoom,
        }
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(point: Vec2): Vec2 {
        const { camera } = this.state
        return {
            x: point.x * camera.zoom + camera.x,
            y: point.y * camera.zoom + camera.y,
        }
    }

    // ============================================================================
    // Assets
    // ============================================================================

    getAsset(id: AssetId): Asset | undefined {
        return this.state.assets[id]
    }

    getAssets(): Asset[] {
        return Object.values(this.state.assets)
    }

    createAsset(asset: Asset): void {
        this.state.assets[asset.id] = asset
        this.notifyListeners()
    }

    deleteAsset(id: AssetId): void {
        delete this.state.assets[id]
        this.notifyListeners()
    }

    // ============================================================================
    // Shape Utils
    // ============================================================================

    getShapeUtil<S extends Shape>(shape: S | S['type']): ShapeUtil<S> {
        const type = typeof shape === 'string' ? shape : shape.type
        return this.shapeUtils.get(type)
    }

    // ============================================================================
    // Hit Testing
    // ============================================================================

    /**
     * Find the topmost shape at a point (in world coordinates)
     */
    getShapeAtPoint(point: Vec2): Shape | null {
        // Iterate in reverse order (top to bottom)
        const shapes = this.getShapes()
        for (let i = shapes.length - 1; i >= 0; i--) {
            const shape = shapes[i]
            const util = this.getShapeUtil(shape)
            if (util.hitTest(shape, point)) {
                return shape
            }
        }
        return null
    }

    /**
     * Find all shapes that intersect with a bounds (in world coordinates)
     */
    getShapesInBounds(bounds: Bounds): Shape[] {
        return this.getShapes().filter(shape => {
            const shapeBounds = this.getShapeUtil(shape).getBounds(shape)
            return this.boundsIntersect(bounds, shapeBounds)
        })
    }

    private boundsIntersect(a: Bounds, b: Bounds): boolean {
        return !(
            a.x + a.w < b.x ||
            b.x + b.w < a.x ||
            a.y + a.h < b.y ||
            b.y + b.h < a.y
        )
    }

    // ============================================================================
    // Copy/Paste/Duplicate
    // ============================================================================

    /**
     * Duplicate shapes with optional offset
     */
    duplicateShapes(shapeIds: ShapeId[], offset: { x: number; y: number } = { x: 20, y: 20 }): this {
        if (shapeIds.length === 0) return this

        const shapesToDuplicate = shapeIds
            .map(id => this.state.shapes[id])
            .filter(Boolean)

        if (shapesToDuplicate.length === 0) return this

        // Pause history for intermediate steps
        this.history.pause()

        try {
            const newShapes: Shape[] = []
            const idMap = new Map<ShapeId, ShapeId>()

            // Create new IDs for all shapes
            for (const shape of shapesToDuplicate) {
                idMap.set(shape.id, this.createShapeId())
            }

            // Clone shapes with new IDs and offset
            for (const shape of shapesToDuplicate) {
                const newId = idMap.get(shape.id)!
                const newShape: Shape = {
                    ...structuredClone(shape),
                    id: newId,
                    x: shape.x + offset.x,
                    y: shape.y + offset.y
                }

                // Update arrow bindings if this is an arrow
                if (newShape.type === 'arrow') {
                    // Handle start binding
                    if (newShape.props.startBinding) {
                        const targetId = newShape.props.startBinding.shapeId
                        if (idMap.has(targetId)) {
                            // Update to new duplicated shape
                            newShape.props.startBinding = {
                                ...newShape.props.startBinding,
                                shapeId: idMap.get(targetId)!
                            }
                        } else {
                            // Remove binding if target not duplicated
                            delete newShape.props.startBinding
                        }
                    }

                    // Handle end binding
                    if (newShape.props.endBinding) {
                        const targetId = newShape.props.endBinding.shapeId
                        if (idMap.has(targetId)) {
                            newShape.props.endBinding = {
                                ...newShape.props.endBinding,
                                shapeId: idMap.get(targetId)!
                            }
                        } else {
                            delete newShape.props.endBinding
                        }
                    }
                }

                newShapes.push(newShape)
            }

            this.history.resume()

            // Record as single operation
            const before = this.captureState()

            for (const shape of newShapes) {
                this.state.shapes[shape.id] = shape
            }
            this.state.selectedIds = new Set(newShapes.map(s => s.id))

            const after = this.captureState()
            this.recordHistory(before, after, `Duplicate ${newShapes.length} shape(s)`)

            this.notifyListeners()
        } finally {
            this.history.resume()
        }

        return this
    }

    /**
     * Copy selected shapes to clipboard
     */
    async copy(): Promise<this> {
        const shapes = this.getSelectedShapes()
        if (shapes.length > 0) {
            await copyShapesToClipboard(shapes)
        }
        return this
    }

    /**
     * Paste shapes from clipboard
     */
    async paste(): Promise<this> {
        const shapes = await pasteShapesFromClipboard()
        if (!shapes || shapes.length === 0) return this

        // Calculate offset based on camera center
        const camera = this.getCamera()
        const offset = {
            x: camera.x + 100,
            y: camera.y + 100
        }

        // Use duplicateShapes logic but with clipboard shapes
        this.history.pause()

        try {
            const newShapes: Shape[] = []
            const idMap = new Map<ShapeId, ShapeId>()

            // Create new IDs
            for (const shape of shapes) {
                idMap.set(shape.id, this.createShapeId())
            }

            // Clone with new IDs
            for (const shape of shapes) {
                const newId = idMap.get(shape.id)!
                const newShape: Shape = {
                    ...structuredClone(shape),
                    id: newId
                }

                // Update arrow bindings
                if (newShape.type === 'arrow') {
                    if (newShape.props.startBinding) {
                        const targetId = newShape.props.startBinding.shapeId
                        if (idMap.has(targetId)) {
                            newShape.props.startBinding.shapeId = idMap.get(targetId)!
                        } else {
                            delete newShape.props.startBinding
                        }
                    }

                    if (newShape.props.endBinding) {
                        const targetId = newShape.props.endBinding.shapeId
                        if (idMap.has(targetId)) {
                            newShape.props.endBinding.shapeId = idMap.get(targetId)!
                        } else {
                            delete newShape.props.endBinding
                        }
                    }
                }

                newShapes.push(newShape)
            }

            this.history.resume()

            // Record as single operation
            const before = this.captureState()

            for (const shape of newShapes) {
                this.state.shapes[shape.id] = shape
            }
            this.state.selectedIds = new Set(newShapes.map(s => s.id))

            const after = this.captureState()
            this.recordHistory(before, after, `Paste ${newShapes.length} shape(s)`)

            this.notifyListeners()
        } finally {
            this.history.resume()
        }

        return this
    }

    /**
     * Generate a new shape ID
     */
    private createShapeId(): ShapeId {
        return `shape:${Date.now()}_${Math.random().toString(36).substr(2, 9)}` as ShapeId
    }

    // ============================================================================
    // History System
    // ============================================================================

    /**
     * Capture current editor state for history
     */
    private captureState(): EditorStateSnapshot {
        // Convert shapes Record to Map first
        const shapesMap = new Map<string, Shape>()
        Object.entries(this.state.shapes).forEach(([id, shape]) => {
            shapesMap.set(id, shape)
        })

        return captureEditorState(shapesMap, Array.from(this.state.selectedIds))
    }

    /**
     * Restore editor state from snapshot
     */
    private applyState(snapshot: EditorStateSnapshot): void {
        // Convert snapshot back to Record
        this.state.shapes = {}
        Object.entries(snapshot.shapes).forEach(([id, shape]) => {
            this.state.shapes[id] = shape
        })

        this.state.selectedIds = new Set(snapshot.selectedShapeIds)
        this.notifyListeners()
    }

    /**
     * Record a history entry
     */
    private recordHistory(before: EditorStateSnapshot, after: EditorStateSnapshot, label?: string): void {
        // Don't record if states are equal
        if (areStatesEqual(before, after)) return

        this.history.record({
            type: 'snapshot',
            before: { shapes: before.shapes, selectedShapeIds: before.selectedShapeIds },
            after: { shapes: after.shapes, selectedShapeIds: after.selectedShapeIds },
            timestamp: Date.now(),
            label
        })
    }

    /**
     * Undo the last operation
     */
    undo(): this {
        const state = this.history.undo()
        if (state) {
            this.applyState(state as EditorStateSnapshot)
        }
        return this
    }

    /**
     * Redo the last undone operation
     */
    redo(): this {
        const state = this.history.redo()
        if (state) {
            this.applyState(state as EditorStateSnapshot)
        }
        return this
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.history.canUndo()
    }

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.history.canRedo()
    }

    /**
     * Pause history recording (for internal operations)
     */
    pauseHistory(): void {
        this.history.pause()
    }

    /**
     * Resume history recording
     */
    resumeHistory(): void {
        this.history.resume()
    }

    /**
     * Start a batch operation
     */
    startBatch(id: string): void {
        this.history.startBatch(id)
    }

    /**
     * End a batch operation
     */
    endBatch(id: string): void {
        this.history.endBatch(id)
    }

    // ============================================================================
    // Serialization
    // ============================================================================

    toJSON(): string {
        return JSON.stringify(serializeCanvasState(this.state))
    }

    loadJSON(json: string): void {
        try {
            const serialized = JSON.parse(json)
            this.state = deserializeCanvasState(serialized)
            this.notifyListeners()
        } catch (error) {
            console.error('Failed to load canvas state:', error)
        }
    }
}
