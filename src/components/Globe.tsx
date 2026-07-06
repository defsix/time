import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CITIES, type City } from '../lib/cities'
import { latLonToVector3, vector3ToLatLon } from '../lib/geo'

const RADIUS = 2

interface GlobeProps {
  onSelectCity: (city: City) => void
  onSelectPoint: (lat: number, lon: number) => void
  selectedCityName: string | null
  userLocation: { lat: number; lon: number } | null
}

// Approximate subsolar point (where the sun is directly overhead right now),
// used purely to shade a day/night terminator on the globe for visual context.
function subsolarPoint(date: Date): { lat: number; lon: number } {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000)
  const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10))
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const lon = -(utcHours - 12) * 15
  return { lat: declination, lon }
}

export default function Globe({ onSelectCity, onSelectPoint, selectedCityName, userLocation }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const selectedCityNameRef = useRef<string | null>(null)
  useEffect(() => {
    selectedCityNameRef.current = selectedCityName
  }, [selectedCityName])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.set(0, 1.2, 5.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 3
    controls.maxDistance = 10
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4

    // Day/night shaded core sphere
    const sunDirUniform = { value: new THREE.Vector3(1, 0, 0) }
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: sunDirUniform,
        dayColor: { value: new THREE.Color(0x0d3b52) },
        nightColor: { value: new THREE.Color(0x030910) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        uniform vec3 dayColor;
        uniform vec3 nightColor;
        varying vec3 vNormal;
        void main() {
          float intensity = dot(normalize(vNormal), normalize(sunDirection));
          float t = smoothstep(-0.15, 0.15, intensity);
          gl_FragColor = vec4(mix(nightColor, dayColor, t), 1.0);
        }
      `,
    })
    const core = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 0.985, 64, 48), coreMaterial)
    scene.add(core)

    // Graticule (lat/lon grid lines)
    const graticuleGroup = new THREE.Group()
    const graticuleMat = new THREE.LineBasicMaterial({ color: 0x2f6f8f, transparent: true, opacity: 0.35 })
    const tzMat = new THREE.LineBasicMaterial({ color: 0x5fd0ff, transparent: true, opacity: 0.55 })

    for (let lat = -75; lat <= 75; lat += 15) {
      const points: THREE.Vector3[] = []
      for (let lon = -180; lon <= 180; lon += 4) {
        points.push(latLonToVector3(lat, lon, RADIUS * 1.001))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      graticuleGroup.add(new THREE.Line(geo, graticuleMat))
    }

    // Meridians every 15 degrees = the 24 nominal time zone boundaries
    for (let lon = -180; lon < 180; lon += 15) {
      const points: THREE.Vector3[] = []
      for (let lat = -90; lat <= 90; lat += 4) {
        points.push(latLonToVector3(lat, lon, RADIUS * 1.001))
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points)
      const isPrimeOrAntimeridian = lon === 0 || lon === -180
      graticuleGroup.add(new THREE.Line(geo, isPrimeOrAntimeridian ? tzMat : graticuleMat))
    }
    scene.add(graticuleGroup)

    // Outer faint wireframe shell for a "globe of wire" silhouette
    const shellGeo = new THREE.SphereGeometry(RADIUS * 1.002, 24, 16)
    const shellMat = new THREE.MeshBasicMaterial({ color: 0x2f6f8f, wireframe: true, transparent: true, opacity: 0.08 })
    scene.add(new THREE.Mesh(shellGeo, shellMat))

    // Invisible hit-sphere for raycasting arbitrary click points
    const hitSphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS, 48, 32),
      new THREE.MeshBasicMaterial({ visible: false }),
    )
    scene.add(hitSphere)

    // City markers
    const markerGroup = new THREE.Group()
    const markerMeshes: THREE.Mesh[] = []
    const markerGeo = new THREE.SphereGeometry(0.028, 12, 12)
    CITIES.forEach((city) => {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffb347 })
      const mesh = new THREE.Mesh(markerGeo, mat)
      mesh.position.copy(latLonToVector3(city.lat, city.lon, RADIUS * 1.01))
      mesh.userData.city = city
      markerGroup.add(mesh)
      markerMeshes.push(mesh)
    })
    scene.add(markerGroup)

    // User location marker (distinct color)
    let userMarker: THREE.Mesh | null = null
    if (userLocation) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x3fff9e })
      userMarker = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), mat)
      userMarker.position.copy(latLonToVector3(userLocation.lat, userLocation.lon, RADIUS * 1.015))
      scene.add(userMarker)
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    // Raycasting for click + hover
    const raycaster = new THREE.Raycaster()
    raycaster.params.Points = { threshold: 0.06 } as unknown as THREE.Raycaster['params']['Points']
    const pointer = new THREE.Vector2()
    let downPos = { x: 0, y: 0 }

    function pointerToNDC(ev: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1
    }

    function handlePointerDown(ev: PointerEvent) {
      downPos = { x: ev.clientX, y: ev.clientY }
    }

    function handlePointerUp(ev: PointerEvent) {
      const dx = ev.clientX - downPos.x
      const dy = ev.clientY - downPos.y
      if (Math.hypot(dx, dy) > 6) return // was a drag, not a click

      pointerToNDC(ev)
      raycaster.setFromCamera(pointer, camera)

      const markerHits = raycaster.intersectObjects(markerMeshes)
      if (markerHits.length > 0) {
        const city = markerHits[0].object.userData.city as City
        onSelectCity(city)
        return
      }

      const sphereHits = raycaster.intersectObject(hitSphere)
      if (sphereHits.length > 0) {
        const { lat, lon } = vector3ToLatLon(sphereHits[0].point, RADIUS)
        onSelectPoint(lat, lon)
      }
    }

    function handlePointerMove(ev: PointerEvent) {
      pointerToNDC(ev)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(markerMeshes)
      renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab'
    }

    renderer.domElement.addEventListener('pointerdown', handlePointerDown)
    renderer.domElement.addEventListener('pointerup', handlePointerUp)
    renderer.domElement.addEventListener('pointermove', handlePointerMove)

    function handleResize() {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    let frameId: number
    function animate() {
      frameId = requestAnimationFrame(animate)

      const sun = subsolarPoint(new Date())
      const sunVec = latLonToVector3(sun.lat, sun.lon, 1)
      sunDirUniform.value.copy(sunVec)

      // Pulse the selected city / user markers gently for visibility
      const t = performance.now() / 500
      markerMeshes.forEach((m) => {
        const isSelected = (m.userData.city as City).name === selectedCityNameRef.current
        const scale = isSelected ? 1.8 + Math.sin(t) * 0.3 : 1
        m.scale.setScalar(scale)
        ;(m.material as THREE.MeshBasicMaterial).color.set(isSelected ? 0x5fd0ff : 0xffb347)
      })

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation])

  return <div ref={mountRef} className="globe-mount" />
}
