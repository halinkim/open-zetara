import { Paper, Canvas } from '@/db/schema';

export const api = {
    papers: {
        list: async (): Promise<Paper[]> => {
            const res = await fetch('/api/papers');
            if (!res.ok) throw new Error('Failed to fetch papers');
            return res.json();
        },
        create: async (file: File, metadata: Paper): Promise<Paper> => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('metadata', JSON.stringify(metadata));

            const res = await fetch('/api/papers', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Failed to create paper');
            return res.json();
        },
        get: async (id: number): Promise<Paper> => {
            const res = await fetch(`/api/papers/${id}`);
            if (!res.ok) throw new Error('Failed to fetch paper');
            return res.json();
        },
        update: async (paper: Paper): Promise<void> => {
            const res = await fetch(`/api/papers/${paper.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paper),
            });
            if (!res.ok) throw new Error('Failed to update paper');
        },
        delete: async (id: number): Promise<void> => {
            const res = await fetch(`/api/papers/${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete paper');
        },
        getPdfUrl: (id: number) => `/api/papers/${id}?type=pdf`,
    },
    canvas: {
        get: async (paperId: number): Promise<Canvas> => {
            const res = await fetch(`/api/canvas/${paperId}`);
            if (!res.ok) throw new Error('Failed to fetch canvas');
            return res.json();
        },
        save: async (paperId: number, elements: string): Promise<void> => {
            const res = await fetch(`/api/canvas/${paperId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ elements }),
            });
            if (!res.ok) throw new Error('Failed to save canvas');
        },
    },
    system: {
        export: () => {
            window.location.href = '/api/export';
        },
        import: async (file: File): Promise<void> => {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/import', {
                method: 'POST',
                body: formData,
            });
            if (!res.ok) throw new Error('Failed to import data');
        }
    }
};
