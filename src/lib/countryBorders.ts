import * as THREE from 'three'
import { mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import worldAtlas from 'world-atlas/countries-110m.json'
import { latLonToVector3 } from './geo'

// Pre-built 110m-resolution Natural Earth country topology (bundled at build
// time — no runtime network fetch). We only need the shared-border mesh, not
// filled polygons, to draw outlines on the wireframe globe.
export function buildCountryBorderGeometry(radius: number): THREE.BufferGeometry {
  const topology = worldAtlas as unknown as Topology
  const countries = topology.objects.countries as GeometryCollection
  const borders = mesh(topology, countries)

  const positions: number[] = []

  for (const line of borders.coordinates) {
    for (let i = 0; i < line.length - 1; i++) {
      const [lon1, lat1] = line[i]
      const [lon2, lat2] = line[i + 1]
      const v1 = latLonToVector3(lat1, lon1, radius)
      const v2 = latLonToVector3(lat2, lon2, radius)
      positions.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z)
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}
