'use client';

import React from 'react';
import { MousePointer2, Type, Square, Circle, ArrowRight, Eraser, Minus } from 'lucide-react';

export type CanvasTool = 'select' | 'text' | 'rect' | 'circle' | 'arrow' | 'line' | 'eraser';

interface CanvasToolbarProps {
    currentTool: CanvasTool;
    onToolChange: (tool: CanvasTool) => void;
}

export function CanvasToolbar({ currentTool, onToolChange }: CanvasToolbarProps) {
    const tools: { id: CanvasTool; icon: React.ReactNode; label: string }[] = [
        { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select' },
        { id: 'text', icon: <Type size={18} />, label: 'Text' },
        { id: 'rect', icon: <Square size={18} />, label: 'Rectangle' },
        { id: 'circle', icon: <Circle size={18} />, label: 'Circle' },
        { id: 'arrow', icon: <ArrowRight size={18} />, label: 'Arrow' },
        { id: 'line', icon: <Minus size={18} />, label: 'Line' },
        { id: 'eraser', icon: <Eraser size={18} />, label: 'Eraser' },
    ];

    return (
        <div
            style={{
                position: 'absolute',
                top: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#333',
                borderRadius: '8px',
                padding: '4px',
                display: 'flex',
                gap: '4px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
                zIndex: 100
            }}
            onMouseDown={(e) => e.stopPropagation()}
        >
            {tools.map(tool => (
                <button
                    key={tool.id}
                    onClick={() => onToolChange(tool.id)}
                    title={tool.label}
                    style={{
                        backgroundColor: currentTool === tool.id ? '#007acc' : 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {tool.icon}
                </button>
            ))}
        </div>
    );
}
