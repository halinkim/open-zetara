'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CanvasItem, ConnectionAnchor, ConnectorItem } from '@/lib/canvas/types';
import { useAppStore } from '@/lib/store';
import { db } from '@/db/schema';
import { CanvasToolbar, CanvasTool } from './CanvasToolbar';
import { getAnchorPosition, generateBezierPath, ANCHOR_POSITIONS, isPointNearPath } from '@/lib/canvas/connectorUtils';

export function CanvasBoard() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { setNavigationTarget, setSelectedPaperId, selectedPaperId } = useAppStore();
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [draggedItem, setDraggedItem] = useState<{ id: string; startX: number; startY: number; initialItemX: number; initialItemY: number } | null>(null);
    const [currentTool, setCurrentTool] = useState<CanvasTool>('select');
    const [items, setItems] = useState<CanvasItem[]>([]);

    // Resizing State
    const [resizingHandle, setResizingHandle] = useState<string | null>(null);
    const [initialResizeState, setInitialResizeState] = useState<{ x: number; y: number; width: number; height: number; mouseX: number; mouseY: number } | null>(null);

    // Connector State
    const [connectorMode, setConnectorMode] = useState<{ step: 'idle' | 'selectingTarget'; fromItemId?: string; fromAnchor?: ConnectionAnchor } | null>(null);
    const [hoveredAnchor, setHoveredAnchor] = useState<{ itemId: string; anchor: ConnectionAnchor } | null>(null);
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

    // Text Editing State
    const [editingTextId, setEditingTextId] = useState<string | null>(null);

    // Load canvas items when paper changes
    useEffect(() => {
        if (!selectedPaperId) {
            setItems([]);
            return;
        }

        const loadCanvas = async () => {
            try {
                // Find canvas for this paper
                const canvas = await db.canvases.where('paperId').equals(selectedPaperId).first();
                if (canvas && canvas.elements) {
                    setItems(JSON.parse(canvas.elements));
                } else {
                    setItems([]);
                }
            } catch (error) {
                console.error('Error loading canvas:', error);
            }
        };

        loadCanvas();
    }, [selectedPaperId]);

    // Save canvas items when they change (debounced)
    useEffect(() => {
        if (!selectedPaperId) return;

        const saveCanvas = async () => {
            try {
                const existing = await db.canvases.where('paperId').equals(selectedPaperId).first();
                const data = {
                    paperId: selectedPaperId,
                    elements: JSON.stringify(items),
                    updatedAt: Date.now()
                };

                if (existing && existing.id) {
                    await db.canvases.update(existing.id, data);
                } else {
                    await db.canvases.add(data);
                }
            } catch (error) {
                console.error('Error saving canvas:', error);
            }
        };

        const timeoutId = setTimeout(saveCanvas, 1000); // Debounce 1s
        return () => clearTimeout(timeoutId);
    }, [items, selectedPaperId]);

    // Delete selected item on Delete/Backspace
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
                setItems(prev => prev.filter(item => item.id !== selectedItemId));
                setSelectedItemId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItemId]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                // Zoom
                e.preventDefault();
                const zoomSensitivity = 0.001;
                const delta = -e.deltaY * zoomSensitivity;

                setScale(prevScale => {
                    const newScale = Math.min(Math.max(prevScale + delta, 0.1), 5);
                    return newScale;
                });
            } else {
                // Pan
                e.preventDefault(); // Prevent browser back/forward swipe
                setOffset(prev => ({
                    x: prev.x - e.deltaX,
                    y: prev.y - e.deltaY
                }));
            }
        };

        // Add non-passive event listener to allow preventDefault
        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Keyboard event handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check if an input/textarea is focused
            const activeElement = document.activeElement as HTMLElement;
            const isInputFocused = activeElement && (
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.tagName === 'INPUT' ||
                activeElement.isContentEditable
            );

            // Don't handle Delete/Backspace if editing text or if focus is on an input
            if (isInputFocused || editingTextId) return;

            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId) {
                e.preventDefault();
                setItems(prev => prev.filter(item => item.id !== selectedItemId));
                setSelectedItemId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItemId, editingTextId]);

    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clickX = (e.clientX - rect.left - offset.x) / scale;
        const clickY = (e.clientY - rect.top - offset.y) / scale;

        // Handle Tool Actions (only if not resizing)
        if (!resizingHandle) {
            if (currentTool === 'text') {
                if (e.button === 0) { // Left click
                    const newItem: CanvasItem = {
                        id: crypto.randomUUID(),
                        type: 'text',
                        x: clickX,
                        y: clickY,
                        width: 200,
                        height: 100,
                        content: 'Double click to edit',
                        fontSize: 16,
                        color: '#ffffff'
                    };
                    setItems(prev => [...prev, newItem]);
                    setCurrentTool('select'); // Switch back to select mode
                    setSelectedItemId(newItem.id); // Select the new item
                    return;
                }
            } else if (currentTool === 'rect') {
                if (e.button === 0) { // Left click
                    const newItem: CanvasItem = {
                        id: crypto.randomUUID(),
                        type: 'shape',
                        shapeType: 'rectangle',
                        x: clickX,
                        y: clickY,
                        width: 100,
                        height: 100,
                        color: '#007acc'
                    };
                    setItems(prev => [...prev, newItem]);
                    setCurrentTool('select');
                    setSelectedItemId(newItem.id);
                    return;
                }
            } else if (currentTool === 'circle') {
                if (e.button === 0) { // Left click
                    const newItem: CanvasItem = {
                        id: crypto.randomUUID(),
                        type: 'shape',
                        shapeType: 'circle',
                        x: clickX,
                        y: clickY,
                        width: 100,
                        height: 100,
                        color: '#00cc88'
                    };
                    setItems(prev => [...prev, newItem]);
                    setCurrentTool('select');
                    setSelectedItemId(newItem.id);
                    return;
                }
            } else if (currentTool === 'arrow') {
                if (e.button === 0) { // Left click
                    const newItem: CanvasItem = {
                        id: crypto.randomUUID(),
                        type: 'shape',
                        shapeType: 'arrow',
                        x: clickX,
                        y: clickY,
                        width: 150,
                        height: 60,
                        color: '#ff6b6b'
                    };
                    setItems(prev => [...prev, newItem]);
                    setCurrentTool('select');
                    setSelectedItemId(newItem.id);
                    return;
                }
            } else if (currentTool === 'connector') {
                if (e.button === 0) { // Left click
                    // Check if clicking on a connection anchor
                    if (hoveredAnchor) {
                        if (!connectorMode || connectorMode.step === 'idle') {
                            // Start connector from this anchor
                            setConnectorMode({
                                step: 'selectingTarget',
                                fromItemId: hoveredAnchor.itemId,
                                fromAnchor: hoveredAnchor.anchor
                            });
                            return;
                        } else if (connectorMode.step === 'selectingTarget' && connectorMode.fromItemId && connectorMode.fromAnchor) {
                            // Complete the connector
                            const newConnector: ConnectorItem = {
                                id: crypto.randomUUID(),
                                type: 'connector',
                                connectorType: 'bezier',
                                fromItemId: connectorMode.fromItemId,
                                fromAnchor: connectorMode.fromAnchor,
                                toItemId: hoveredAnchor.itemId,
                                toAnchor: hoveredAnchor.anchor,
                                x: 0, // Not used for connectors
                                y: 0,
                                width: 0,
                                height: 0,
                                color: '#888',
                                strokeWidth: 2
                            };
                            setItems(prev => [...prev, newConnector]);
                            setConnectorMode(null);
                            setCurrentTool('select');
                            return;
                        }
                    }

                    // Click elsewhere - cancel connector mode
                    setConnectorMode(null);
                    return;
                }
            }
        }

        // Check if clicking on an item
        // Find clicked item (reverse order to pick top-most)
        const clickedItem = [...items].reverse().find(item =>
            clickX >= item.x && clickX <= item.x + item.width &&
            clickY >= item.y && clickY <= item.y + item.height
        );

        if (clickedItem) {
            if (e.button === 0 && !e.altKey) { // Left click only
                setSelectedItemId(clickedItem.id);
                setDraggedItem({
                    id: clickedItem.id,
                    startX: e.clientX,
                    startY: e.clientY,
                    initialItemX: clickedItem.x,
                    initialItemY: clickedItem.y
                });
                e.stopPropagation(); // Prevent panning start
                return;
            }
        } else {
            // Clicked on empty space
            setSelectedItemId(null);
        }

        if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Click to pan
            setIsPanning(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (resizingHandle && selectedItemId && initialResizeState) {
            const dx = (e.clientX - initialResizeState.mouseX) / scale;
            const dy = (e.clientY - initialResizeState.mouseY) / scale;

            setItems(prev => prev.map(item => {
                if (item.id === selectedItemId) {
                    let newX = initialResizeState.x;
                    let newY = initialResizeState.y;
                    let newWidth = initialResizeState.width;
                    let newHeight = initialResizeState.height;

                    if (resizingHandle.includes('e')) newWidth = Math.max(20, initialResizeState.width + dx);
                    if (resizingHandle.includes('w')) {
                        newWidth = Math.max(20, initialResizeState.width - dx);
                        newX = initialResizeState.x + (initialResizeState.width - newWidth);
                    }
                    if (resizingHandle.includes('s')) newHeight = Math.max(20, initialResizeState.height + dy);
                    if (resizingHandle.includes('n')) {
                        newHeight = Math.max(20, initialResizeState.height - dy);
                        newY = initialResizeState.y + (initialResizeState.height - newHeight);
                    }

                    return { ...item, x: newX, y: newY, width: newWidth, height: newHeight };
                }
                return item;
            }));
        } else if (draggedItem) {
            const dx = (e.clientX - draggedItem.startX) / scale;
            const dy = (e.clientY - draggedItem.startY) / scale;

            setItems(prev => prev.map(item => {
                if (item.id === draggedItem.id) {
                    return {
                        ...item,
                        x: draggedItem.initialItemX + dx,
                        y: draggedItem.initialItemY + dy
                    };
                }
                return item;
            }));
        } else if (isPanning) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }

        // Track hovered item and anchor for connector tool
        if (currentTool === 'connector' && !isPanning && !draggedItem && !resizingHandle) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
                const mouseX = (e.clientX - rect.left - offset.x) / scale;
                const mouseY = (e.clientY - rect.top - offset.y) / scale;

                let foundHoveredItem: string | null = null;
                let foundHoveredAnchor: { itemId: string; anchor: ConnectionAnchor } | null = null;

                for (const item of items) {
                    if (item.type === 'connector') continue; // Skip connectors

                    // Add margin for easier anchor hovering
                    const hoverMargin = 15;

                    // Check if hovering over item (with expanded area)
                    if (mouseX >= item.x - hoverMargin && mouseX <= item.x + item.width + hoverMargin &&
                        mouseY >= item.y - hoverMargin && mouseY <= item.y + item.height + hoverMargin) {
                        foundHoveredItem = item.id;

                        // Check if hovering over an anchor
                        for (const anchor of ANCHOR_POSITIONS) {
                            const anchorPos = getAnchorPosition(item, anchor);
                            const distance = Math.sqrt(
                                (mouseX - anchorPos.x) ** 2 + (mouseY - anchorPos.y) ** 2
                            );
                            if (distance < 8 / scale) { // 8px hit radius
                                foundHoveredAnchor = { itemId: item.id, anchor };
                                break;
                            }
                        }
                        break;
                    }
                }

                setHoveredItemId(foundHoveredItem);
                setHoveredAnchor(foundHoveredAnchor);
            }
        } else {
            if (hoveredItemId) setHoveredItemId(null);
            if (hoveredAnchor) setHoveredAnchor(null);
        }
    };

    const handleMouseUp = () => {
        setIsPanning(false);
        setDraggedItem(null);
        setResizingHandle(null);
        setInitialResizeState(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/zetara-pointer');
        if (!data) return;

        try {
            const payload = JSON.parse(data);
            if (payload.type === 'pointer') {
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;

                // Calculate drop position relative to canvas world
                const dropX = (e.clientX - rect.left - offset.x) / scale;
                const dropY = (e.clientY - rect.top - offset.y) / scale;

                const newItem: CanvasItem = {
                    id: crypto.randomUUID(),
                    type: 'pointer',
                    x: dropX,
                    y: dropY,
                    width: 200, // Default width
                    height: 150, // Default height
                    pdfId: payload.pdfId,
                    page: payload.page,
                    rect: payload.rect,
                    image: payload.image // Save snapshot
                };

                setItems(prev => [...prev, newItem]);
            }
        } catch (err) {
            console.error('Failed to parse drop data', err);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleTextChange = (id: string, newContent: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, content: newContent } : item
        ));
    };

    const handleResizeStart = (e: React.MouseEvent, handle: string, item: CanvasItem) => {
        e.stopPropagation(); // Prevent drag start
        setResizingHandle(handle);
        setInitialResizeState({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            mouseX: e.clientX,
            mouseY: e.clientY
        });
    };

    return (
        <div
            ref={containerRef}
            className="canvas-container"
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                backgroundColor: '#1e1e1e',
                cursor: isPanning ? 'grabbing' : 'default',
                position: 'relative',
                userSelect: 'none',
                WebkitUserSelect: 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <CanvasToolbar currentTool={currentTool} onToolChange={setCurrentTool} />

            <div
                className="canvas-world"
                style={{
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                    transformOrigin: '0 0',
                    width: '100%',
                    height: '100%',
                    position: 'absolute'
                }}
            >
                {/* Grid Background (Optional) */}
                <div style={{
                    position: 'absolute',
                    top: -5000,
                    left: -5000,
                    width: 10000,
                    height: 10000,
                    backgroundImage: 'radial-gradient(#444 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                    opacity: 0.3,
                    pointerEvents: 'none'
                }} />

                {/* Items */}
                {items.filter(item => item.type !== 'connector').map(item => (
                    <div
                        key={item.id}
                        style={{
                            position: 'absolute',
                            left: item.x,
                            top: item.y,
                            width: item.width,
                            height: item.height,
                            backgroundColor: item.type === 'pointer' ? 'transparent' : (item.type === 'text' ? 'transparent' : item.color),
                            border: selectedItemId === item.id ? '2px solid #007acc' : (item.type === 'pointer' || item.type === 'text' ? 'none' : '1px solid #555'),
                            boxShadow: selectedItemId === item.id ? '0 0 10px rgba(0, 122, 204, 0.5)' : 'none',
                            padding: '0',
                            color: '#fff',
                            overflow: 'hidden',
                            zIndex: selectedItemId === item.id ? 10 : 1,
                            cursor: 'move'
                        }}
                        onMouseDown={(e) => {
                            // Allow event to bubble to container for drag handling
                        }}
                        onClick={(e) => {
                            // Single click only selects (handled by container), doesn't enter edit mode
                        }}
                        onDoubleClick={(e) => {
                            if (item.type === 'text') {
                                e.stopPropagation();
                                setEditingTextId(item.id);
                                const textarea = (e.currentTarget as HTMLElement).querySelector('textarea');
                                setTimeout(() => textarea?.focus(), 0);
                            }
                        }}
                    >
                        {/* Resize Handles */}
                        {selectedItemId === item.id && (
                            <>
                                {['nw', 'ne', 'sw', 'se'].map(handle => (
                                    <div
                                        key={handle}
                                        style={{
                                            position: 'absolute',
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: '#fff',
                                            border: '1px solid #007acc',
                                            top: handle.includes('n') ? '-5px' : 'auto',
                                            bottom: handle.includes('s') ? '-5px' : 'auto',
                                            left: handle.includes('w') ? '-5px' : 'auto',
                                            right: handle.includes('e') ? '-5px' : 'auto',
                                            cursor: `${handle}-resize`,
                                            zIndex: 20
                                        }}
                                        onMouseDown={(e) => handleResizeStart(e, handle, item)}
                                    />
                                ))}
                            </>
                        )}

                        {item.type === 'text' && (
                            <textarea
                                value={(item as any).content}
                                onChange={(e) => handleTextChange(item.id, e.target.value)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: `${(item as any).fontSize || 16}px`,
                                    resize: 'none',
                                    outline: 'none',
                                    fontFamily: 'inherit',
                                    userSelect: 'text',
                                    WebkitUserSelect: 'text',
                                    padding: '10px',
                                    cursor: selectedItemId === item.id ? 'text' : 'move',
                                    pointerEvents: editingTextId === item.id ? 'auto' : 'none'
                                }}
                                onMouseDown={(e) => {
                                    // Textarea is only interactive when in editing mode
                                    if (editingTextId === item.id) {
                                        e.stopPropagation();
                                    }
                                }}
                                onFocus={() => {
                                    setEditingTextId(item.id);
                                }}
                                onBlur={() => {
                                    setEditingTextId(null);
                                }}
                            />
                        )}
                        {item.type === 'shape' && (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: (item as any).shapeType === 'circle' ? '50%' : '0',
                                backgroundColor: (item as any).shapeType === 'arrow' ? 'transparent' : 'inherit',
                                position: 'relative'
                            }}>
                                {(item as any).shapeType === 'arrow' && (
                                    <svg
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 100 100"
                                        preserveAspectRatio="none"
                                        style={{ position: 'absolute', top: 0, left: 0 }}
                                    >
                                        {/* Arrow body */}
                                        <line
                                            x1="5"
                                            y1="50"
                                            x2="70"
                                            y2="50"
                                            stroke={(item as any).color}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                        />
                                        {/* Arrow head */}
                                        <polygon
                                            points="70,30 95,50 70,70"
                                            fill={(item as any).color}
                                        />
                                    </svg>
                                )}
                            </div>
                        )}
                        {item.type === 'pointer' && (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: selectedItemId === item.id ? 'pointer' : 'move',
                                    overflow: 'hidden'
                                }}
                                onClick={(e) => {
                                    // If already selected, navigate to the page
                                    if (selectedItemId === item.id) {
                                        e.stopPropagation();
                                        const pdfId = Number((item as any).pdfId);
                                        const page = (item as any).page;
                                        const rect = (item as any).rect;

                                        setSelectedPaperId(pdfId);
                                        setNavigationTarget({ pdfId, page, rect });
                                    }
                                }}
                            >
                                {(item as any).image ? (
                                    <img
                                        src={(item as any).image}
                                        alt="Snapshot"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain',
                                            pointerEvents: 'none'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                        color: '#888'
                                    }}>
                                        Pointer Link (Page {(item as any).page})
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Connectors Layer (SVG) */}
                <svg
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        overflow: 'visible'
                    }}
                >
                    {items.filter(item => item.type === 'connector').map(item => {
                        const connector = item as ConnectorItem;
                        const fromItem = items.find(i => i.id === connector.fromItemId);
                        const toItem = items.find(i => i.id === connector.toItemId);

                        if (!fromItem || !toItem || fromItem.type === 'connector' || toItem.type === 'connector') return null;

                        const from = getAnchorPosition(fromItem, connector.fromAnchor);
                        const to = getAnchorPosition(toItem, connector.toAnchor);
                        const path = generateBezierPath(from, to, connector.fromAnchor, connector.toAnchor);

                        return (
                            <path
                                key={connector.id}
                                d={path}
                                stroke={selectedItemId === connector.id ? '#007acc' : connector.color}
                                strokeWidth={connector.strokeWidth}
                                fill="none"
                                style={{
                                    pointerEvents: 'stroke',
                                    filter: selectedItemId === connector.id ? 'drop-shadow(0 0 3px rgba(0, 122, 204, 0.8))' : 'none'
                                }}
                                onMouseDown={(e) => {
                                    if (currentTool === 'select') {
                                        e.stopPropagation();
                                        setSelectedItemId(connector.id);
                                    }
                                }}
                            />
                        );
                    })}

                    {/* Connector preview while creating */}
                    {connectorMode && connectorMode.step === 'selectingTarget' && connectorMode.fromItemId && connectorMode.fromAnchor && hoveredAnchor && (
                        (() => {
                            const fromItem = items.find(i => i.id === connectorMode.fromItemId);
                            const toItem = items.find(i => i.id === hoveredAnchor.itemId);
                            if (!fromItem || !toItem || fromItem.type === 'connector' || toItem.type === 'connector') return null;

                            const from = getAnchorPosition(fromItem, connectorMode.fromAnchor);
                            const to = getAnchorPosition(toItem, hoveredAnchor.anchor);
                            const path = generateBezierPath(from, to, connectorMode.fromAnchor, hoveredAnchor.anchor);

                            return (
                                <path
                                    d={path}
                                    stroke="#007acc"
                                    strokeWidth={2}
                                    fill="none"
                                    strokeDasharray="5,5"
                                    style={{ pointerEvents: 'none' }}
                                />
                            );
                        })()
                    )}
                </svg>

                {/* Connection Anchors */}
                {currentTool === 'connector' && items.map(item => {
                    if (item.type === 'connector') return null;

                    // Show anchors when hovering over item or when in connector mode
                    const showAnchors = hoveredItemId === item.id ||
                        (connectorMode && connectorMode.step === 'selectingTarget');

                    if (!showAnchors) return null;

                    return (
                        <div key={`anchors-${item.id}`}>
                            {ANCHOR_POSITIONS.map(anchor => {
                                const pos = getAnchorPosition(item, anchor);
                                const isHovered = hoveredAnchor?.itemId === item.id && hoveredAnchor.anchor === anchor;
                                const isSource = connectorMode?.fromItemId === item.id && connectorMode.fromAnchor === anchor;

                                return (
                                    <div
                                        key={anchor}
                                        style={{
                                            position: 'absolute',
                                            left: pos.x,
                                            top: pos.y,
                                            width: '12px',
                                            height: '12px',
                                            marginLeft: '-6px',
                                            marginTop: '-6px',
                                            borderRadius: '50%',
                                            backgroundColor: isSource ? '#ff6b6b' : (isHovered ? '#007acc' : '#00cc88'),
                                            border: '2px solid white',
                                            cursor: 'crosshair',
                                            zIndex: 100,
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                            transition: 'transform 0.15s',
                                            transform: isHovered ? 'scale(1.3)' : 'scale(1)'
                                        }}
                                    />
                                );
                            })}
                        </div>
                    );
                })}
            </div>

            {/* Controls Overlay */}
            <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                backgroundColor: '#333',
                padding: '5px 10px',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '12px'
            }}>
                {Math.round(scale * 100)}%
            </div>
        </div>
    );
}
