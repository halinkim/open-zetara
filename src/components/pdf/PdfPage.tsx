'use client';

import React, { useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { SelectionOverlay } from './SelectionOverlay';

interface PdfPageProps {
    pdfDoc: PDFDocumentProxy;
    pageNum: number;
    scale: number;
    pdfId: number;
    onSelection: (rect: { page: number; x: number; y: number; width: number; height: number }) => void;
    interactionMode?: 'select' | 'text';
}

export function PdfPage({ pdfDoc, pageNum, scale, pdfId, onSelection, interactionMode = 'select' }: PdfPageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const textLayerRef = useRef<HTMLDivElement>(null);
    const renderTaskRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;

        const renderPage = async () => {
            // Cancel previous render task if it exists
            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) { }
            }

            try {
                const page = await pdfDoc.getPage(pageNum);

                if (!isMounted || !canvasRef.current) return;

                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (!context) return;

                // Use device pixel ratio for high-DPI displays
                const dpr = window.devicePixelRatio || 1;

                // Set canvas size in CSS pixels
                canvas.style.width = `${viewport.width}px`;
                canvas.style.height = `${viewport.height}px`;

                // Set actual canvas size in device pixels
                canvas.width = viewport.width * dpr;
                canvas.height = viewport.height * dpr;

                // Scale the context to match device pixel ratio
                context.scale(dpr, dpr);

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                const renderTask = page.render(renderContext as any);
                renderTaskRef.current = renderTask;

                await renderTask.promise;

                // Render Text Layer
                if (textLayerRef.current) {
                    textLayerRef.current.innerHTML = ''; // Clear previous text
                    textLayerRef.current.style.setProperty('--scale-factor', `${scale}`);

                    const textContent = await page.getTextContent();

                    // Import pdfjs-dist dynamically to access renderTextLayer
                    try {
                        const pdfjsDist = await import('pdfjs-dist');
                        // Cast to any to avoid type issues with different versions
                        const lib = pdfjsDist as any;
                        const renderTextLayer = lib.renderTextLayer;

                        if (renderTextLayer) {
                            await renderTextLayer({
                                textContentSource: textContent,
                                container: textLayerRef.current,
                                viewport: viewport,
                                textDivs: []
                            }).promise;
                        }
                    } catch (err) {
                        console.error('Failed to render text layer:', err);
                    }
                }

            } catch (error: any) {
                // Suppress rendering cancellation errors
                if (
                    error?.name === 'RenderingCancelledException' ||
                    error?.name === 'RenderingCancelled' ||
                    error?.message?.includes('Rendering cancelled') ||
                    error?.message?.includes('RenderingCancelled')
                ) {
                    return;
                }
                console.error(`Error rendering page ${pageNum}:`, error);
            }
        };

        renderPage();

        return () => {
            isMounted = false;
            if (renderTaskRef.current) {
                try { renderTaskRef.current.cancel(); } catch (e) { }
            }
        };
    }, [pdfDoc, pageNum, scale]);

    return (
        <div style={{ position: 'relative', marginBottom: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <div
                ref={textLayerRef}
                className="textLayer"
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    overflow: 'hidden',
                    lineHeight: 1.0,
                    pointerEvents: interactionMode === 'text' ? 'auto' : 'none'
                }}
            />
            {interactionMode === 'select' && (
                <SelectionOverlay
                    onSelectionComplete={(rect) => onSelection({ ...rect, page: pageNum })}
                    dragData={{
                        type: 'pointer',
                        pdfId,
                        page: pageNum
                    }}
                />
            )}
        </div>
    );
}
