// Utility: get polygon/freehand bounds
export function getPolygonBounds(points) {
    const xs = points.filter((_, i) => i % 2 === 0);
    const ys = points.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
// Utility: rectangle intersection
export function rectsIntersect(a, b) {
    return (a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y);
}
// Get polygon centroid
export function getPolygonCentroid(points) {
    let x = 0, y = 0, area = 0;
    const n = points.length / 2;
    for (let i = 0; i < n; i++) {
        const x0 = points[2 * i];
        const y0 = points[2 * i + 1];
        const x1 = points[2 * ((i + 1) % n)];
        const y1 = points[2 * ((i + 1) % n) + 1];
        const a = x0 * y1 - x1 * y0;
        area += a;
        x += (x0 + x1) * a;
        y += (y0 + y1) * a;
    }
    area = area / 2;
    if (area === 0)
        return { x: points[0], y: points[1] };
    x = x / (6 * area);
    y = y / (6 * area);
    return { x, y };
}
// Get territory center
export function getTerritoryCenter(territory) {
    if (territory.shape.type === 'polygon' || territory.shape.type === 'freehand') {
        return getPolygonCentroid(territory.shape.points);
    }
    else if (territory.shape.type === 'rect' || territory.shape.type === 'ellipse') {
        return {
            x: territory.shape.x + territory.shape.width / 2,
            y: territory.shape.y + territory.shape.height / 2
        };
    }
    return { x: 0, y: 0 };
}
// Get territory edges
export function getTerritoryEdges(territory) {
    const edges = [];
    if (territory.shape.type === 'polygon' || territory.shape.type === 'freehand') {
        const points = territory.shape.points;
        for (let i = 0; i < points.length; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];
            const x2 = points[(i + 2) % points.length];
            const y2 = points[(i + 3) % points.length];
            edges.push({ x1, y1, x2, y2 });
        }
    }
    else if (territory.shape.type === 'rect') {
        const { x, y, width, height } = territory.shape;
        edges.push({ x1: x, y1: y, x2: x + width, y2: y }, // top
        { x1: x + width, y1: y, x2: x + width, y2: y + height }, // right
        { x1: x + width, y1: y + height, x2: x, y2: y + height }, // bottom
        { x1: x, y1: y + height, x2: x, y2: y } // left
        );
    }
    else if (territory.shape.type === 'ellipse') {
        // For ellipses, we'll approximate with a polygon of 32 points
        const { x, y, width, height } = territory.shape;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const radiusX = Math.abs(width) / 2;
        const radiusY = Math.abs(height) / 2;
        const points = [];
        for (let i = 0; i < 32; i++) {
            const angle = (i / 32) * Math.PI * 2;
            points.push(centerX + Math.cos(angle) * radiusX, centerY + Math.sin(angle) * radiusY);
        }
        for (let i = 0; i < points.length; i += 2) {
            const x1 = points[i];
            const y1 = points[i + 1];
            const x2 = points[(i + 2) % points.length];
            const y2 = points[(i + 3) % points.length];
            edges.push({ x1, y1, x2, y2 });
        }
    }
    return edges;
}
// Find nearest edge
export function findNearestEdge(territories, point, snapDistance = 10) {
    let nearestEdge = null;
    let minDistance = snapDistance;
    for (const territory of Object.values(territories)) {
        const edges = getTerritoryEdges(territory);
        for (const edge of edges) {
            const dx = edge.x2 - edge.x1;
            const dy = edge.y2 - edge.y1;
            const length = Math.sqrt(dx * dx + dy * dy);
            if (length === 0)
                continue;
            const t = Math.max(0, Math.min(1, ((point.x - edge.x1) * dx + (point.y - edge.y1) * dy) / (length * length)));
            const nearestX = edge.x1 + t * dx;
            const nearestY = edge.y1 + t * dy;
            const distance = Math.sqrt(Math.pow(point.x - nearestX, 2) + Math.pow(point.y - nearestY, 2));
            if (distance < minDistance) {
                minDistance = distance;
                nearestEdge = {
                    edge,
                    point: { x: nearestX, y: nearestY },
                    distance
                };
            }
        }
    }
    return nearestEdge;
}
