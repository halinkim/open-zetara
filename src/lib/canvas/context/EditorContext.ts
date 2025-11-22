import React, { createContext, useContext } from 'react'
import { Editor } from '../editor/Editor'

const EditorContext = createContext<Editor | null>(null)

export const EditorProvider = EditorContext.Provider

export function useEditorContext() {
    const editor = useContext(EditorContext)
    if (!editor) {
        throw new Error('useEditorContext must be used within an EditorProvider')
    }
    return editor
}
