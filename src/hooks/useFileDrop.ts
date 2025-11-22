import { useCallback, useState } from 'react';
import { db } from '@/db/schema';
import { extractPdfMetadata, fetchCrossrefMetadata } from '@/lib/metadataUtils';

export function useFileDrop() {
    const [processing, setProcessing] = useState(false);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        const pdfs = files.filter(f => f.type === 'application/pdf');

        if (pdfs.length === 0) return;

        setProcessing(true);
        try {
            for (const file of pdfs) {
                // 1. Extract basic metadata from PDF
                let metadata = await extractPdfMetadata(file);

                // 2. If DOI exists, fetch from Crossref and merge
                if (metadata.doi) {
                    try {
                        const crossrefData = await fetchCrossrefMetadata(metadata.doi);
                        metadata = { ...metadata, ...crossrefData }; // Crossref data overrides PDF data
                    } catch (err) {
                        console.warn(`Failed to fetch Crossref data for DOI ${metadata.doi}`, err);
                    }
                }

                // 3. Save to DB
                await db.papers.add({
                    title: metadata.title || file.name.replace('.pdf', ''),
                    authors: metadata.authors || ['Unknown'],
                    journal: metadata.journal,
                    doi: metadata.doi,
                    year: metadata.year,
                    url: metadata.url,
                    pdfBlob: file,
                    createdAt: Date.now(),
                });
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
        } finally {
            setProcessing(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }, []);

    return {
        handleDrop,
        handleDragOver,
        processing
    };
}
