import React from 'react'
import { BaseShape } from './types'
import { useAppStore } from '@/lib/store'

export interface PaperNodeShape extends BaseShape<'paper-node', {
    paperId: number;
    title: string;
    authors: string[];
    year: string;
    journal?: string;
}> { }

export const PaperNodeComponent = ({
    shape,
    isSelected,
    isEditing
}: {
    shape: PaperNodeShape
    isSelected: boolean
    isEditing: boolean
}) => {
    const { setSelectedPaperId } = useAppStore()

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        // Set the selected paper
        setSelectedPaperId(shape.props.paperId)
        // Dispatch event to switch to canvas view
        window.dispatchEvent(new CustomEvent('navigate-to-paper'))
    }

    return (
        <div
            onDoubleClick={handleDoubleClick}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'var(--bg-secondary)',
                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                userSelect: 'none',
                cursor: 'pointer'
            }}
        >
            <div style={{
                fontWeight: 'bold',
                fontSize: '14px',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
            }}>
                {shape.props.title}
            </div>

            <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {shape.props.authors.join(', ')}
            </div>

            <div style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                marginTop: 'auto',
                display: 'flex',
                justifyContent: 'space-between'
            }}>
                <span>{shape.props.journal}</span>
                <span>{shape.props.year}</span>
            </div>
        </div>
    )
}
