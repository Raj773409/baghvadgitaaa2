import test from 'node:test';
import assert from 'node:assert/strict';
import {
  latLonToVector3,
  cameraFocusForLatLon,
  greatCircleAngleRad,
  greatCircleArcPoints,
  projectEquirectangular,
  curvedConnectionArcPath,
} from './geodesy';
import { PARTICIPATING_COUNTRIES } from '../content/countryContent';

test('latLonToVector3 places coordinates accurately on sphere radius', () => {
  const r = 2.4;
  for (const country of PARTICIPATING_COUNTRIES) {
    const pos = latLonToVector3(country.lat, country.lon, r);
    const mag = Math.hypot(pos.x, pos.y, pos.z);
    assert.ok(Math.abs(mag - r) < 1e-6, `Expected radius ${r} for ${country.id}, got ${mag}`);
  }
});

test('North Pole and South Pole map to +Y and -Y', () => {
  const north = latLonToVector3(90, 0, 1);
  assert.ok(Math.abs(north.y - 1) < 1e-6);
  assert.ok(Math.hypot(north.x, north.z) < 1e-6);

  const south = latLonToVector3(-90, 0, 1);
  assert.ok(Math.abs(south.y + 1) < 1e-6);
});

test('cameraFocusForLatLon scales outward cleanly and greatCircleAngleRad is symmetric', () => {
  const india = PARTICIPATING_COUNTRIES.find((c) => c.id === 'india')!;
  const japan = PARTICIPATING_COUNTRIES.find((c) => c.id === 'japan')!;
  const focus = cameraFocusForLatLon(india.lat, india.lon, 6.2);
  assert.ok(Math.abs(Math.hypot(focus.x, focus.y, focus.z) - 6.2) < 1e-6);

  const ab = greatCircleAngleRad(india.lat, india.lon, japan.lat, japan.lon);
  const ba = greatCircleAngleRad(japan.lat, japan.lon, india.lat, india.lon);
  assert.ok(Math.abs(ab - ba) < 1e-9);
  assert.ok(ab > 0 && ab < Math.PI);

  const arc = greatCircleArcPoints(india.lat, india.lon, japan.lat, japan.lon, 2.0, 0.35, 24);
  assert.equal(arc.length, 25);
  const startMag = Math.hypot(arc[0].x, arc[0].y, arc[0].z);
  const midMag = Math.hypot(arc[12].x, arc[12].y, arc[12].z);
  const endMag = Math.hypot(arc[24].x, arc[24].y, arc[24].z);
  assert.ok(Math.abs(startMag - 2.0) < 1e-4);
  assert.ok(Math.abs(endMag - 2.0) < 1e-4);
  assert.ok(Math.abs(midMag - 2.35) < 1e-4);
});

test('projectEquirectangular maps center and country coordinates within viewport bounds', () => {
  const origin = projectEquirectangular(0, 0, 1000, 500);
  assert.equal(origin.x, 500);
  assert.equal(origin.y, 250);

  for (const country of PARTICIPATING_COUNTRIES) {
    const pt = projectEquirectangular(country.lat, country.lon, 1000, 500);
    assert.ok(pt.x >= 0 && pt.x <= 1000);
    assert.ok(pt.y >= 0 && pt.y <= 500);
  }

  const arc = curvedConnectionArcPath({ x: 700, y: 200 }, { x: 240, y: 160 });
  assert.ok(arc.startsWith('M 700 200 Q '));
});

test('exactly 18 participating countries are published', () => {
  assert.equal(PARTICIPATING_COUNTRIES.length, 18);
  const ids = new Set(PARTICIPATING_COUNTRIES.map((c) => c.id));
  assert.equal(ids.size, 18);
});
