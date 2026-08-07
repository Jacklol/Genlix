export type SvgPoint = {
  x: number;
  y: number;
};

function parsePointsString(points: string): SvgPoint[] {
  if (!points.trim()) {
    return [];
  }

  return points
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });
}

export function getPolygonCentroid(points: string): SvgPoint | null {
  const coords = parsePointsString(points);

  if (coords.length === 0) {
    return null;
  }

  const sum = coords.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: Math.round(sum.x / coords.length),
    y: Math.round(sum.y / coords.length),
  };
}

export function viewBoxPointToContainer(
  svg: SVGSVGElement,
  wrap: HTMLElement,
  point: SvgPoint,
): { left: number; top: number } | null {
  const ctm = svg.getScreenCTM();

  if (!ctm) {
    return null;
  }

  const svgPoint = svg.createSVGPoint();
  svgPoint.x = point.x;
  svgPoint.y = point.y;

  const screenPoint = svgPoint.matrixTransform(ctm);
  const rect = wrap.getBoundingClientRect();

  return {
    left: screenPoint.x - rect.left,
    top: screenPoint.y - rect.top,
  };
}
