/**
 * React hook for using the Canvas Editor
 */

import { useEffect, useState, useMemo } from 'react'
import { Editor } from './Editor'
import { CanvasState } from '../store'

/**
 * Hook to create and manage an Editor instance
 */
export function useEditor(initialState?: Partial<CanvasState>): Editor {
    const editor = useMemo(() => new Editor(initialState), [])
    const [, setTick] = useState(0)

    useEffect(() => {
        // Subscribe to editor changes and force re-render
        const unsubscribe = editor.subscribe(() => {
            setTick(tick => tick + 1)
        })

        return unsubscribe
    }, [editor])

    return editor
}

/**
 * Hook to get the current editor state
 * Subscribes to editor changes
 */
export function useEditorState(editor: Editor): CanvasState {
    const [state, setState] = useState(() => editor.getState())

    useEffect(() => {
        const unsubscribe = editor.subscribe(() => {
            setState(editor.getState())
        })

        return unsubscribe
    }, [editor])

    return state
}
