import fs from 'fs/promises';
import path from 'path';
import { getConfig } from '@/config';

export interface ActivityItem {
    id: string;
    timestamp: number;
    type: 'paper_added' | 'canvas_edited';
    details: {
        paperId?: number;
        title?: string;
    };
}

export interface ActivityLog {
    [date: string]: ActivityItem[];
}

export class ActivityService {
    private static getFilePath() {
        const config = getConfig();
        return path.join(config.dataDir, 'activity.json');
    }

    private static async ensureFile() {
        const filePath = this.getFilePath();
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, JSON.stringify({}), 'utf-8');
        }
    }

    static async logActivity(type: ActivityItem['type'], details: ActivityItem['details']) {
        await this.ensureFile();
        const filePath = this.getFilePath();

        // Get today's date string (YYYY-MM-DD) in local time
        // Note: This uses server's local time. For a real app, might want to standardize on UTC or user's timezone.
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];

        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const log: ActivityLog = JSON.parse(content);

            if (!log[dateStr]) {
                log[dateStr] = [];
            }

            const newItem: ActivityItem = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                timestamp: Date.now(),
                type,
                details
            };

            log[dateStr].push(newItem);

            await fs.writeFile(filePath, JSON.stringify(log, null, 2), 'utf-8');
        } catch (error) {
            console.error('Failed to log activity:', error);
        }
    }

    static async getActivities(): Promise<ActivityLog> {
        await this.ensureFile();
        const filePath = this.getFilePath();
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Failed to get activities:', error);
            return {};
        }
    }
}
