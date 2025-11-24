import React, { useEffect, useRef } from 'react'
import { useEditor, useEditorState } from '@/lib/canvas/editor'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { migrateOldToNew, migrateNewToOld } from '@/lib/canvas/migration'
import { CanvasToolbar, CanvasTool } from './CanvasToolbar'
import { BaseCanvas } from './BaseCanvas'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export function CanvasBoard() {
    const editor = useEditor()
    const state = useEditorState(editor)
    const containerRef = useRef<HTMLDivElement>(null)
    const svgRef = useRef<SVGSVGElement>(null)
    const { selectedPaperId } = useAppStore()
    const [currentTool, setCurrentTool] = React.useState<CanvasTool>('select')

    // Use the interaction hook
    // const {
    //     isPanning,
    //     handleMouseDown,
    //     handleMouseMove,
    //     handleMouseUp,
    //     handleResizeStart,
    //     handleDoubleClick,
    //     handleDragOver,
    //     handleDrop,
    //     snapLines
    // } = useCanvasInteraction(editor, containerRef, currentTool, setCurrentTool)

    const loadedPaperId = useRef<number | null>(null)

    // Load canvas data when paper changes
    useEffect(() => {
        if (!selectedPaperId) {
            return
        }

        // Reset loaded state when ID changes
        if (loadedPaperId.current !== selectedPaperId) {
            loadedPaperId.current = null
        }

        const loadCanvas = async () => {
            try {
                const canvas = await api.canvas.get(selectedPaperId)

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
                // Mark as loaded
                // console.log('Canvas loaded for paper:', selectedPaperId)
                loadedPaperId.current = selectedPaperId
            } catch (error) {
                console.error('Error loading canvas:', error)
            }
        }

        loadCanvas()
    }, [selectedPaperId, editor])

    // Save canvas data when it changes
    useEffect(() => {
        if (!selectedPaperId) return
        // Don't save if we haven't loaded the current paper yet
        if (loadedPaperId.current !== selectedPaperId) {
            return
        }

        const saveCanvas = async () => {
            try {
                // Convert shapes back to old format
                const oldItems = migrateNewToOld(state.shapes, state.assets)

                await api.canvas.save(selectedPaperId, JSON.stringify(oldItems))
            } catch (error) {
                console.error('Error saving canvas:', error)
            }
        }

        // Debounce saves
        const timeoutId = setTimeout(saveCanvas, 1000)
        return () => clearTimeout(timeoutId)
    }, [state.shapes, state.assets, selectedPaperId])

    // Handle keyboard shortcuts
    useKeyboardShortcuts(editor)

    return (
        <BaseCanvas
            editor={editor}
            state={state}
            currentTool={currentTool}
            onToolChange={setCurrentTool}
        />
    )
}
