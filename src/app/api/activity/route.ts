import { NextResponse } from 'next/server';
import { ActivityService } from '@/lib/server/activity';

export async function GET() {
    try {
        const activities = await ActivityService.getActivities();
        return NextResponse.json(activities);
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }
}
