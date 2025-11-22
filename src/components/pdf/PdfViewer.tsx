'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { db } from '@/db/schema';
import { PdfPage } from './PdfPage';
import { ZoomIn, ZoomOut, Maximize, Minimize, MousePointer2, Type } from 'lucide-react';
import { initPdfWorker } from '@/lib/pdfInit';

// Import type only
import type { PDFDocumentProxy } from 'pdfjs-dist';

export function PdfViewer() {
    const { selectedPaperId, navigationTarget, setNavigationTarget } = useAppStore();
    const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
    const [scale, setScale] = useState(1.0);
    const [fitMode, setFitMode] = useState<'width' | 'page' | 'manual'>('width');
    const [interactionMode, setInteractionMode] = useState<'select' | 'text'>('select');
    const [loading, setLoading] = useState(false);
    const [numPages, setNumPages] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Load PDF Document
    useEffect(() => {
        if (!selectedPaperId) return;

        let isMounted = true;

        const loadPdf = async () => {
            setLoading(true);
            try {
                // Dynamic import
                const pdfjsLib = await initPdfWorker();

                const paper = await db.papers.get(selectedPaperId);
                if (!paper || !paper.pdfBlob) return;

                const arrayBuffer = await paper.pdfBlob.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const doc = await loadingTask.promise;

                if (isMounted) {
                    setPdfDoc(doc);
                    setNumPages(doc.numPages);
                    // Trigger initial fit
                    setFitMode('width');
                }
            } catch (error) {
                console.error('Error loading PDF:', error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadPdf();

        return () => {
            isMounted = false;
        };
    }, [selectedPaperId]);

    // Handle Fit Modes
    useEffect(() => {
        if (!pdfDoc || !containerRef.current || fitMode === 'manual') return;

        const updateScale = async () => {
            try {
                const page = await pdfDoc.getPage(1);
                const viewport = page.getViewport({ scale: 1 });
                const container = containerRef.current;

                if (!container) return;

                // Subtract padding/scrollbar
                const availableWidth = container.clientWidth - 40;
                const availableHeight = container.clientHeight - 40;

                if (fitMode === 'width') {
                    setScale(availableWidth / viewport.width);
                } else if (fitMode === 'page') {
                    const scaleW = availableWidth / viewport.width;
                    const scaleH = availableHeight / viewport.height;
                    setScale(Math.min(scaleW, scaleH));
                }
            } catch (e) {
                console.error('Error updating scale:', e);
            }
        };

        updateScale();

        // Resize observer to update on window resize
        const observer = new ResizeObserver(updateScale);
        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [pdfDoc, fitMode]);

    // Handle Wheel Zoom
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheel = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                const zoomSensitivity = 0.001;
                const delta = -e.deltaY * zoomSensitivity;

                setFitMode('manual');
                setScale(prevScale => {
                    const newScale = Math.min(Math.max(prevScale + delta, 0.1), 5);
                    return newScale;
                });
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheel);
        };
    }, [loading, pdfDoc]);

    const handleZoomIn = () => {
        setFitMode('manual');
        setScale(prev => Math.min(prev + 0.1, 5.0));
    };

    const handleZoomOut = () => {
        setFitMode('manual');
        setScale(prev => Math.max(prev - 0.1, 0.5));
    };

    const handleSelection = (rect: { page: number; x: number; y: number; width: number; height: number }) => {
        console.log('Selected area:', rect);
    };

    // Handle navigation from canvas
    useEffect(() => {
        if (!navigationTarget || navigationTarget.pdfId !== selectedPaperId) return;

        const targetPageElement = pageRefs.current.get(navigationTarget.page);
        if (targetPageElement && containerRef.current) {
            targetPageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Clear navigation target after scrolling
            setTimeout(() => {
                setNavigationTarget(null);
            }, 500);
        }
    }, [navigationTarget, selectedPaperId, setNavigationTarget]);

    if (!selectedPaperId) return <div className="flex-center full-size">Select a paper to view</div>;
    if (loading) return <div className="flex-center full-size">Loading PDF...</div>;
    if (!pdfDoc) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            {/* Toolbar */}
            <div style={{
                height: '40px',
                backgroundColor: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '0 10px'
            }}>
                {/* Mode Toggles */}
                <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid var(--border-color)', paddingRight: '10px', marginRight: '5px' }}>
                    <button
                        onClick={() => setInteractionMode('select')}
                        title="Area Selection Mode (Drag to snapshot)"
                        style={{
                            background: interactionMode === 'select' ? 'var(--bg-active)' : 'none',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            color: interactionMode === 'select' ? 'var(--text-active)' : 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <MousePointer2 size={18} />
                    </button>
                    <button
                        onClick={() => setInteractionMode('text')}
                        title="Text Selection Mode"
                        style={{
                            background: interactionMode === 'text' ? 'var(--bg-active)' : 'none',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px',
                            color: interactionMode === 'text' ? 'var(--text-active)' : 'var(--text-primary)',
                            cursor: 'pointer'
                        }}
                    >
                        <Type size={18} />
                    </button>
                </div>

                <button onClick={handleZoomOut} title="Zoom Out" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <ZoomOut size={18} />
                </button>
                <span style={{ minWidth: '40px', textAlign: 'center', fontSize: '12px' }}>{Math.round(scale * 100)}%</span>
                <button onClick={handleZoomIn} title="Zoom In" style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
                    <ZoomIn size={18} />
                </button>
                <div style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)', margin: '0 5px' }} />
                <button onClick={() => setFitMode('width')} title="Fit Width" style={{ background: 'none', border: 'none', color: fitMode === 'width' ? 'var(--text-active)' : 'var(--text-primary)', cursor: 'pointer' }}>
                    <Maximize size={18} />
                </button>
                <button onClick={() => setFitMode('page')} title="Fit Page" style={{ background: 'none', border: 'none', color: fitMode === 'page' ? 'var(--text-active)' : 'var(--text-primary)', cursor: 'pointer' }}>
                    <Minimize size={18} />
                </button>
            </div>

            {/* Scrollable Area */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    backgroundColor: '#525659',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '20px'
                }}
            >
                {Array.from({ length: numPages }, (_, i) => (
                    <div key={i + 1} ref={(el) => {
                        if (el) {
                            pageRefs.current.set(i + 1, el);
                        }
                    }}>
                        <PdfPage
                            pdfDoc={pdfDoc}
                            pageNum={i + 1}
                            scale={scale}
                            pdfId={selectedPaperId}
                            onSelection={handleSelection}
                            interactionMode={interactionMode}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
