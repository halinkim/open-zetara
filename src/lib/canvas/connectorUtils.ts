import { CanvasItem, ConnectionAnchor, ConnectorItem } from './types';

export function getAnchorPosition(item: CanvasItem, anchor: ConnectionAnchor): { x: number; y: number } {
    if (item.type === 'connector') {
        return { x: 0, y: 0 }; // Connectors don't have anchors
    }

    const { x, y, width, height } = item;

    const anchorMap: Record<ConnectionAnchor, { x: number; y: number }> = {
        'n': { x: x + width / 2, y },
        'ne': { x: x + width, y },
        'e': { x: x + width, y: y + height / 2 },
        'se': { x: x + width, y: y + height },
        's': { x: x + width / 2, y: y + height },
        'sw': { x, y: y + height },
        'w': { x, y: y + height / 2 },
        'nw': { x, y }
    };

    return anchorMap[anchor];
}

export function generateBezierPath(
    from: { x: number; y: number },
    to: { x: number; y: number },
    fromAnchor: ConnectionAnchor,
    toAnchor: ConnectionAnchor
): string {
    // Calculate control points based on anchor directions
    const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
    const offset = Math.min(distance * 0.4, 100); // Max 100px offset

    const directionMap: Record<ConnectionAnchor, { dx: number; dy: number }> = {
        'n': { dx: 0, dy: -1 },
        'ne': { dx: 0.7, dy: -0.7 },
        'e': { dx: 1, dy: 0 },
        'se': { dx: 0.7, dy: 0.7 },
        's': { dx: 0, dy: 1 },
        'sw': { dx: -0.7, dy: 0.7 },
        'w': { dx: -1, dy: 0 },
        'nw': { dx: -0.7, dy: -0.7 }
    };

    const fromDir = directionMap[fromAnchor];
    const toDir = directionMap[toAnchor];

    const cp1 = {
        x: from.x + fromDir.dx * offset,
        y: from.y + fromDir.dy * offset
    };

    const cp2 = {
        x: to.x + toDir.dx * offset,
        y: to.y + toDir.dy * offset
    };

    return `M ${from.x},${from.y} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${to.x},${to.y}`;
}

export function isPointNearPath(
    point: { x: number; y: number },
    from: { x: number; y: number },
    to: { x: number; y: number },
    threshold: number = 10
): boolean {
    // Simplified hit detection - check if point is near line segment
    // For better accuracy with Bézier curves, we'd need to sample the curve
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return false;

    // Project point onto line
    const t = Math.max(0, Math.min(1, ((point.x - from.x) * dx + (point.y - from.y) * dy) / (length * length)));
    const projection = {
        x: from.x + t * dx,
        y: from.y + t * dy
    };

    const distance = Math.sqrt(
        (point.x - projection.x) ** 2 + (point.y - projection.y) ** 2
    );

    return distance <= threshold;
}

export const ANCHOR_POSITIONS: ConnectionAnchor[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
