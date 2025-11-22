'use client';

import React, { useState, useRef } from 'react';
import { settingsManager } from '@/lib/settings';

interface SelectionOverlayProps {
    onSelectionComplete: (rect: { x: number; y: number; width: number; height: number }) => void;
    dragData?: any;
}

export function SelectionOverlay({ onSelectionComplete, dragData }: SelectionOverlayProps) {
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [selection, setSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        // Only start selection if clicking on background, not on existing selection
        if ((e.target as HTMLElement).closest('.selection-box')) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsSelecting(true);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
        setSelection(null); // Clear previous selection
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
        if (!isSelecting) return;
        setIsSelecting(false);

        const width = Math.abs(currentPos.x - startPos.x);
        const height = Math.abs(currentPos.y - startPos.y);
        const x = Math.min(currentPos.x, startPos.x);
        const y = Math.min(currentPos.y, startPos.y);

        if (width > 5 && height > 5) {
            const newSelection = { x, y, width, height };
            setSelection(newSelection);
            onSelectionComplete(newSelection);
        }
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (!selection || !containerRef.current) return;

        // Capture snapshot
        let snapshot = '';
        try {
            // Find the canvas element (sibling of this overlay's parent or in the same container)
            // Structure: div(relative) -> [canvas, SelectionOverlay]
            const parent = containerRef.current.parentElement;
            const canvas = parent?.querySelector('canvas');

            console.log('Snapshot Debug:', { parent, canvas });

            if (canvas) {
                // Create a temporary canvas to crop the image
                const tempCanvas = document.createElement('canvas');
                const dpr = window.devicePixelRatio || 1;

                // Get snapshot scale from settings
                const snapshotScale = settingsManager.getSettings().snapshot.resolutionScale;

                // Set temp canvas size to selection size (scaled by DPR and additional scale)
                tempCanvas.width = selection.width * dpr * snapshotScale;
                tempCanvas.height = selection.height * dpr * snapshotScale;

                const ctx = tempCanvas.getContext('2d');
                if (ctx) {
                    // Enable image smoothing for better quality
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';

                    // Draw the selected portion of the original canvas
                    // Source coordinates need to be scaled by DPR if the source canvas is scaled
                    ctx.drawImage(
                        canvas,
                        selection.x * dpr, selection.y * dpr, selection.width * dpr, selection.height * dpr,
                        0, 0, tempCanvas.width, tempCanvas.height
                    );
                    snapshot = tempCanvas.toDataURL('image/png');
                    console.log('High-res snapshot captured (scale: ' + snapshotScale + '), length:', snapshot.length);
                }
            } else {
                console.warn('Canvas element not found for snapshot');
            }
        } catch (err) {
            console.error('Failed to capture snapshot:', err);
        }

        const payload = {
            ...dragData,
            rect: selection,
            image: snapshot
        };

        e.dataTransfer.setData('application/zetara-pointer', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                cursor: 'crosshair',
                zIndex: 10,
            }}
        >
            {/* Active Selection (while dragging mouse) */}
            {isSelecting && (
                <div
                    style={{
                        position: 'absolute',
                        left: Math.min(startPos.x, currentPos.x),
                        top: Math.min(startPos.y, currentPos.y),
                        width: Math.abs(currentPos.x - startPos.x),
                        height: Math.abs(currentPos.y - startPos.y),
                        border: '2px solid var(--focus-border)',
                        backgroundColor: 'rgba(0, 122, 204, 0.2)',
                        pointerEvents: 'none',
                    }}
                />
            )}

            {/* Completed Selection (Draggable) */}
            {selection && !isSelecting && (
                <div
                    className="selection-box"
                    draggable
                    onDragStart={handleDragStart}
                    style={{
                        position: 'absolute',
                        left: selection.x,
                        top: selection.y,
                        width: selection.width,
                        height: selection.height,
                        border: '2px solid var(--focus-border)',
                        backgroundColor: 'rgba(0, 122, 204, 0.4)',
                        cursor: 'grab',
                        pointerEvents: 'auto',
                    }}
                />
            )}
        </div>
    );
}
