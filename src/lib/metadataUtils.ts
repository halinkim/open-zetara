import { Paper } from '@/db/schema';
import { initPdfWorker } from './pdfInit';

export async function extractPdfMetadata(pdfBlob: Blob): Promise<Partial<Paper>> {
    try {
        const pdfjsLib = await initPdfWorker();

        const arrayBuffer = await pdfBlob.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        const metadata = await doc.getMetadata();

        const info = metadata.info as any;

        // Extract basic info
        const result: Partial<Paper> = {};

        if (info) {
            if (info.Title) result.title = info.Title;
            if (info.Author) result.authors = [info.Author];
            if (info.Subject) result.journal = info.Subject; // Sometimes journal is here

            // Try to find DOI in Custom Metadata or Subject
            // This is a heuristic
            const doiRegex = /10.\d{4,9}\/[-._;()/:A-Z0-9]+/i;
            if (info.DOI) {
                result.doi = info.DOI;
            } else if (info.Subject && doiRegex.test(info.Subject)) {
                const match = info.Subject.match(doiRegex);
                if (match) result.doi = match[0];
            }
        }

        return result;
    } catch (error) {
        console.error('Error extracting PDF metadata:', error);
        return {};
    }
}

export async function fetchCrossrefMetadata(doi: string): Promise<Partial<Paper>> {
    try {
        const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(doi)}`);
        if (!response.ok) throw new Error('Failed to fetch from Crossref');

        const data = await response.json();
        const item = data.message;

        const result: Partial<Paper> = {
            title: item.title?.[0] || '',
            authors: item.author?.map((a: any) => `${a.given} ${a.family}`) || [],
            journal: item['container-title']?.[0] || '',
            year: item.created?.['date-parts']?.[0]?.[0]?.toString() || '',
            doi: item.DOI,
            url: item.URL
        };

        return result;
    } catch (error) {
        console.error('Error fetching Crossref metadata:', error);
        throw error;
    }
}

export async function searchCrossref(query: string): Promise<any[]> {
    try {
        const response = await fetch(`https://api.crossref.org/works?query=${encodeURIComponent(query)}&rows=5`);
        if (!response.ok) throw new Error('Failed to search Crossref');

        const data = await response.json();
        return data.message.items.map((item: any) => ({
            title: item.title?.[0],
            authors: item.author?.map((a: any) => `${a.given} ${a.family}`) || [],
            journal: item['container-title']?.[0],
            year: item.created?.['date-parts']?.[0]?.[0]?.toString(),
            doi: item.DOI
        }));
    } catch (error) {
        console.error('Error searching Crossref:', error);
        return [];
    }
}
