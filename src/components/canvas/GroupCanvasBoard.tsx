import React, { useEffect, useRef, useState } from 'react'
import { useEditor } from '@/lib/canvas/editor'
import { useEditorState } from '@/lib/canvas/editor/useEditor'
import { BaseCanvas } from './BaseCanvas'
import { CanvasTool } from './CanvasToolbar'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { api } from '@/lib/api'
import { PaperSelectorDialog } from '@/components/groups/PaperSelectorDialog'
import { Paper } from '@/db/schema'
import { Plus } from 'lucide-react'

interface GroupCanvasBoardProps {
    groupId: string;
}

export function GroupCanvasBoard({ groupId }: GroupCanvasBoardProps) {
    const editor = useEditor()
    const state = useEditorState(editor)
    const [currentTool, setCurrentTool] = useState<CanvasTool>('select')
    const loadedGroupId = useRef<string | null>(null)
    const [isPaperSelectorOpen, setIsPaperSelectorOpen] = useState(false)

    // Handle keyboard shortcuts
    useKeyboardShortcuts(editor)

    // Load canvas data when group changes
    useEffect(() => {
        if (loadedGroupId.current === groupId) return

        const loadCanvas = async () => {
            try {
                const group = await api.groups.get(groupId)
                if (group && group.elements) {
                    try {
                        const parsed = JSON.parse(group.elements)
                        // Check if it's a valid state object (not an array, has camera)
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.camera) {
                            editor.loadJSON(group.elements)
                        } else {
                            throw new Error('Invalid canvas state')
                        }
                    } catch (e) {
                        // Fallback to empty state
                        editor.loadJSON(JSON.stringify({
                            shapes: {},
                            assets: {},
                            selectedIds: [],
                            editingId: null,
                            camera: { x: 0, y: 0, zoom: 1 }
                        }))
                    }
                } else {
                    // Initialize empty canvas if no data
                    editor.loadJSON(JSON.stringify({
                        shapes: {},
                        assets: {},
                        selectedIds: [],
                        editingId: null,
                        camera: { x: 0, y: 0, zoom: 1 }
                    }))
                }
                loadedGroupId.current = groupId
            } catch (error) {
                console.error('Failed to load group canvas:', error)
            }
        }

        loadCanvas()
    }, [groupId, editor])

    // Save canvas data on change
    useEffect(() => {
        if (loadedGroupId.current !== groupId) return

        const saveCanvas = async () => {
            const json = editor.toJSON()
            try {
                await api.groups.update(groupId, { elements: json })
            } catch (error) {
                console.error('Failed to save group canvas:', error)
            }
        }

        // Debounce save
        const timeoutId = setTimeout(saveCanvas, 1000)
        return () => clearTimeout(timeoutId)
    }, [state, groupId, editor])

    const handleAddPaper = (paper: Paper) => {
        const camera = editor.getCamera()
        // Calculate world coordinates to place it in the center of the view
        // screen = world * zoom + camera
        // world = (screen - camera) / zoom
        // We want to place it at screen (100, 100)
        const x = (100 - camera.x) / camera.zoom
        const y = (100 - camera.y) / camera.zoom

        editor.createShape('paper-node', {
            x,
            y,
            width: 200,
            height: 150,
            props: {
                paperId: paper.id,
                title: paper.title,
                authors: paper.authors,
                year: paper.year || '',
                journal: paper.journal || ''
            }
        })
        setIsPaperSelectorOpen(false)
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <BaseCanvas
                editor={editor}
                state={state}
                currentTool={currentTool}
                onToolChange={setCurrentTool}
            />

            {/* Add Paper Button */}
            <button
                onClick={() => setIsPaperSelectorOpen(true)}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    zIndex: 100
                }}
            >
                <Plus size={16} />
                <span>Add Paper</span>
            </button>

            <PaperSelectorDialog
                isOpen={isPaperSelectorOpen}
                onClose={() => setIsPaperSelectorOpen(false)}
                onSelect={handleAddPaper}
            />
        </div>
    )
}
