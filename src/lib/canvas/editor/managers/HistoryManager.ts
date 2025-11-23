/**
 * History Manager for Canvas Editor
 * Provides undo/redo functionality with stack-based architecture
 */

export interface HistoryEntry {
    type: 'snapshot'
    before: HistoryState
    after: HistoryState
    timestamp: number
    label?: string
}

export interface HistoryState {
    shapes: Record<string, any>
    selectedShapeIds: string[]
}

export interface HistoryStack {
    undos: HistoryEntry[]
    redos: HistoryEntry[]
}

export interface HistoryManagerOptions {
    maxStackSize?: number
}

export class HistoryManager {
    private stack: HistoryStack = {
        undos: [],
        redos: []
    }

    private maxStackSize: number
    private isRecording = true
    private batchId: string | null = null
    private batchEntries: HistoryEntry[] = []

    constructor(options: HistoryManagerOptions = {}) {
        this.maxStackSize = options.maxStackSize ?? 100
    }

    /**
     * Record a history entry
     */
    record(entry: HistoryEntry): void {
        if (!this.isRecording) return

        // If we're in a batch, accumulate entries
        if (this.batchId) {
            this.batchEntries.push(entry)
            return
        }

        // Add to undo stack
        this.stack.undos.push(entry)

        // Limit stack size
        if (this.stack.undos.length > this.maxStackSize) {
            this.stack.undos.shift()
        }

        // Clear redo stack when new action is recorded
        this.stack.redos = []
    }

    /**
     * Undo the last operation
     */
    undo(): HistoryState | null {
        if (this.stack.undos.length === 0) return null

        const entry = this.stack.undos.pop()!
        this.stack.redos.push(entry)

        return entry.before
    }

    /**
     * Redo the last undone operation
     */
    redo(): HistoryState | null {
        if (this.stack.redos.length === 0) return null

        const entry = this.stack.redos.pop()!
        this.stack.undos.push(entry)

        return entry.after
    }

    /**
     * Start a batch operation
     */
    startBatch(id: string): void {
        this.batchId = id
        this.batchEntries = []
    }

    /**
     * End a batch operation and record as single entry
     */
    endBatch(id: string): void {
        if (this.batchId !== id) {
            console.warn(`Batch ID mismatch: expected ${this.batchId}, got ${id}`)
            return
        }

        if (this.batchEntries.length > 0) {
            // Merge all batch entries into one
            const firstEntry = this.batchEntries[0]
            const lastEntry = this.batchEntries[this.batchEntries.length - 1]

            const mergedEntry: HistoryEntry = {
                type: 'snapshot',
                before: firstEntry.before,
                after: lastEntry.after,
                timestamp: firstEntry.timestamp,
                label: firstEntry.label
            }

            this.stack.undos.push(mergedEntry)

            // Limit stack size
            if (this.stack.undos.length > this.maxStackSize) {
                this.stack.undos.shift()
            }

            // Clear redo stack
            this.stack.redos = []
        }

        this.batchId = null
        this.batchEntries = []
    }

    /**
     * Pause history recording
     */
    pause(): void {
        this.isRecording = false
    }

    /**
     * Resume history recording
     */
    resume(): void {
        this.isRecording = true
    }

    /**
     * Clear all history
     */
    clear(): void {
        this.stack = {
            undos: [],
            redos: []
        }
    }

    /**
     * Check if undo is available
     */
    canUndo(): boolean {
        return this.stack.undos.length > 0
    }

    /**
     * Check if redo is available
     */
    canRedo(): boolean {
        return this.stack.redos.length > 0
    }

    /**
     * Get stack sizes for debugging
     */
    getStackSize(): { undos: number; redos: number } {
        return {
            undos: this.stack.undos.length,
            redos: this.stack.redos.length
        }
    }

    /**
     * Get debug information
     */
    debug(): any {
        return {
            stack: this.stack,
            isRecording: this.isRecording,
            batchId: this.batchId,
            batchEntriesCount: this.batchEntries.length
        }
    }
}
