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

export class Editor {
    private state: CanvasState
    private shapeUtils: ShapeUtilRegistry
    private listeners: Set<() => void> = new Set()

    constructor(
        initialState?: Partial<CanvasState>,
        shapeUtils?: ShapeUtilRegistry
    ) {
        this.state = {
            ...createEmptyCanvasState(),
            ...initialState,
        }
        this.shapeUtils = shapeUtils || defaultShapeUtils
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
        const maxIndex = Math.max(0, ...Object.values(this.state.shapes).map(s => s.index || 0))
        const shape = createShapeHelper(type, { ...partial, index: maxIndex + 1 } as any)
        this.state.shapes[shape.id] = shape as Shape
        this.notifyListeners()
        return shape as Extract<Shape, { type: T }>
    }

    updateShape(id: ShapeId, partial: Partial<Shape>): void {
        const shape = this.state.shapes[id]
        if (!shape) return

        this.state.shapes[id] = { ...shape, ...partial }
        this.notifyListeners()
    }

    updateShapes(updates: { id: ShapeId, partial: Partial<Shape> }[]): void {
        let changed = false
        updates.forEach(({ id, partial }) => {
            const shape = this.state.shapes[id]
            if (shape) {
                this.state.shapes[id] = { ...shape, ...partial }
                changed = true
            }
        })
        if (changed) {
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
        ids.forEach(id => {
            delete this.state.shapes[id]
            this.state.selectedIds.delete(id)
        })
        if (this.state.editingId && ids.includes(this.state.editingId)) {
            this.state.editingId = null
        }
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
        this.notifyListeners()
    }

    bringForward(ids: ShapeId[]): void {
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
