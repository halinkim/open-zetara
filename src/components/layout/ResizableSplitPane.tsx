'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableSplitPaneProps {
    left: React.ReactNode;
    right: React.ReactNode;
    initialSplit?: number; // Percentage (0-100)
    minLeft?: number; // Pixels
    minRight?: number; // Pixels
    storageKey?: string; // Key for localStorage persistence
}

export function ResizableSplitPane({
    left,
    right,
    initialSplit = 50,
    minLeft = 200,
    minRight = 200,
    storageKey
}: ResizableSplitPaneProps) {
    const [split, setSplit] = useState(initialSplit);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Load persisted split
    useEffect(() => {
        if (storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                    setSplit(parsed);
                }
            }
        }
    }, [storageKey]);

    // Save split to persistence
    const saveSplit = useCallback((value: number) => {
        setSplit(value);
        if (storageKey) {
            localStorage.setItem(storageKey, value.toString());
        }
    }, [storageKey]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        const newLeftWidth = e.clientX - containerRect.left;
        const containerWidth = containerRect.width;

        // Calculate percentage
        let newSplit = (newLeftWidth / containerWidth) * 100;

        // Apply constraints (convert pixels to percentage for check)
        const minLeftPercent = (minLeft / containerWidth) * 100;
        const maxLeftPercent = 100 - ((minRight / containerWidth) * 100);

        if (newSplit < minLeftPercent) newSplit = minLeftPercent;
        if (newSplit > maxLeftPercent) newSplit = maxLeftPercent;

        saveSplit(newSplit);
    }, [isDragging, minLeft, minRight, saveSplit]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={containerRef}
            style={{
                display: 'flex',
                width: '100%',
                height: '100%',
                overflow: 'hidden'
            }}
        >
            {/* Left Pane */}
            <div style={{ width: `${split}%`, overflow: 'hidden', position: 'relative' }}>
                {left}
                {/* Overlay to prevent iframe/pdf interaction while dragging */}
                {isDragging && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 9999, cursor: 'col-resize' }} />
                )}
            </div>

            {/* Handle */}
            <div
                onMouseDown={handleMouseDown}
                style={{
                    width: '4px',
                    backgroundColor: isDragging ? 'var(--accent-color)' : 'var(--border-color)',
                    cursor: 'col-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    transition: 'background-color 0.2s',
                    position: 'relative'
                }}
                className="hover:bg-[var(--accent-color)]"
            >
                {/* Invisible wider hit area */}
                <div style={{ position: 'absolute', width: '16px', height: '100%', cursor: 'col-resize', zIndex: -1 }} />

                {/* Grip Icon (Optional, maybe too noisy) */}
                {/* <div style={{ 
                    width: '16px', 
                    height: '32px', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: '4px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: '1px solid var(--border-color)',
                    pointerEvents: 'none'
                }}>
                    <GripVertical size={12} color="var(--text-secondary)" />
                </div> */}
            </div>

            {/* Right Pane */}
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                {right}
                {isDragging && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 9999, cursor: 'col-resize' }} />
                )}
            </div>
        </div>
    );
}
