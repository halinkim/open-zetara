let pdfjsLib: any = null;

export async function initPdfWorker() {
    if (pdfjsLib) return pdfjsLib;

    // Dynamic import to avoid SSR issues with DOMMatrix
    pdfjsLib = await import('pdfjs-dist');

    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    return pdfjsLib;
}
