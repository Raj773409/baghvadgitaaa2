export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Converts geographic latitude/longitude (in degrees) to 3D Cartesian
 * coordinates on a sphere of the given radius using Three.js standard
 * Y-up equirectangular sphere mapping (phi = (90 - lat), theta = (lon + 180)).
 */
export function latLonToVector3(latDeg: number, lonDeg: number, radius: number): Vec3Tuple {
  const phi = (90 - latDeg) * DEG_TO_RAD;
  const theta = (lonDeg + 180) * DEG_TO_RAD;

  const sinPhi = Math.sin(phi);
  return {
    x: -radius * sinPhi * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * sinPhi * Math.sin(theta),
  };
}

/**
 * Projects geographic coordinates onto an equirectangular 2D SVG canvas.
 */
export function projectEquirectangular(
  latDeg: number,
  lonDeg: number,
  width: number,
  height: number,
): Point2D {
  const clampedLat = Math.max(-85, Math.min(85, latDeg));
  const clampedLon = Math.max(-180, Math.min(180, lonDeg));
  const x = ((clampedLon + 180) / 360) * width;
  const y = ((90 - clampedLat) / 180) * height;
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2)),
  };
}

/**
 * Generates an SVG quadratic Bezier arc curving gracefully between two map points.
 */
export function curvedConnectionArcPath(from: Point2D, to: Point2D): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const lift = Math.min(95, Math.max(18, dist * 0.24));
  const ctrlY = Math.max(12, midY - lift);
  return `M ${from.x} ${from.y} Q ${midX.toFixed(2)} ${ctrlY.toFixed(2)} ${to.x} ${to.y}`;
}

/**
 * Computes a camera position looking directly at a surface coordinate from a given radial distance.
 */
export function cameraFocusForLatLon(latDeg: number, lonDeg: number, distance: number): Vec3Tuple {
  return latLonToVector3(latDeg, lonDeg, distance);
}

/**
 * Computes great-circle central angle in radians between two geographic coordinates.
 */
export function greatCircleAngleRad(
  lat1Deg: number,
  lon1Deg: number,
  lat2Deg: number,
  lon2Deg: number,
): number {
  const lat1 = lat1Deg * DEG_TO_RAD;
  const lat2 = lat2Deg * DEG_TO_RAD;
  const dLat = (lat2Deg - lat1Deg) * DEG_TO_RAD;
  const dLon = (lon2Deg - lon1Deg) * DEG_TO_RAD;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const clamped = Math.min(1, Math.max(0, a));
  return 2 * Math.atan2(Math.sqrt(clamped), Math.sqrt(1 - clamped));
}

/**
 * Generates smooth 3D points along a spherical great-circle arc lifted by a
 * gentle parabolic altitude profile between two geographic coordinates.
 */
export function greatCircleArcPoints(
  lat1Deg: number,
  lon1Deg: number,
  lat2Deg: number,
  lon2Deg: number,
  radius: number,
  altitude: number,
  segments = 32,
): Vec3Tuple[] {
  const start = latLonToVector3(lat1Deg, lon1Deg, 1);
  const end = latLonToVector3(lat2Deg, lon2Deg, 1);
  const dot = Math.max(-1, Math.min(1, start.x * end.x + start.y * end.y + start.z * end.z));
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);

  const count = Math.max(2, segments);
  const points: Vec3Tuple[] = [];

  for (let i = 0; i <= count; i++) {
    const t = i / count;
    let x: number;
    let y: number;
    let z: number;

    if (sinOmega < 1e-4) {
      x = start.x + (end.x - start.x) * t;
      y = start.y + (end.y - start.y) * t;
      z = start.z + (end.z - start.z) * t;
      const len = Math.hypot(x, y, z) || 1;
      x /= len;
      y /= len;
      z /= len;
    } else {
      const k1 = Math.sin((1 - t) * omega) / sinOmega;
      const k2 = Math.sin(t * omega) / sinOmega;
      x = start.x * k1 + end.x * k2;
      y = start.y * k1 + end.y * k2;
      z = start.z * k1 + end.z * k2;
    }

    const r = radius + Math.sin(t * Math.PI) * altitude;
    points.push({
      x: Number((x * r).toFixed(5)),
      y: Number((y * r).toFixed(5)),
      z: Number((z * r).toFixed(5)),
    });
  }

  return points;
}

