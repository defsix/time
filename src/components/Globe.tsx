import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CITIES, type City } from '../lib/cities'
import { latLonToVector3, vector3ToLatLon, slerpUnitVectors } from '../lib/geo'
import { buildCountryBorderGeometry } from '../lib/countryBorders'

const RADIUS = 2
const FLY_DURATION_MS = 1200

export interface FlyToRequest {
  city: City
  nonce: number
}

interface GlobeProps {
  onSelectCity: (city: City) => void
  onSelectPoint: (lat: number, lon: number) => void
  selectedCityName: string | null
  userLocation: { lat: number; lon: number } | null
  flyToRequest: FlyToRequest | null
}

// Colors for the wireframe overlay (graticule, time-zone meridians, country
// borders). These sit on top of the globe's own day/night shading, which is
// always the same regardless of the page's light/dark theme, so the overlay
// colors are fixed too — tuned to stay visible against both the bright day
// side and the near-black night side.
const GRATICULE_COLOR = 0xcdeeff
const GRATICULE_OPACITY = 0.28
const MERIDIAN_COLOR = 0x6fdcff
const MERIDIAN_OPACITY = 0.6
const COUNTRY_BORDER_COLOR = 0xf3fbff
const COUNTRY_BORDER_OPACITY = 0.8
const SHELL_COLOR = 0xcdeeff
const SHELL_OPACITY = 0.09

// Approximate subsolar point (where the sun is directly overhead right now),
// used to shade a physically-motivated day/night terminator on the globe.
// This is independent of the light/dark UI theme — it always reflects the
// real sun regardless of which color scheme the page is in.
function subsolarPoint(date: Date): { lat: number; lon: number } {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0)
  const dayOfYear = Math.floor((date.getTime() - start) / 86400000)
  const declination = -23.44 * Math.cos((2 * Math.PI / 365) * (dayOfYear + 10))
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
  const lon = -(utcHours - 12) * 15
  return { lat: declination, lon }
}

export default function Globe({ onSelectCity, onSelectPoint, selectedCityName, userLocation, flyToRequest }: GlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const selectedCityNameRef = useRef<string | null>(null)
  useEffect(() => {
    selectedCityNameRef.current = selectedCityName
  }, [selectedCityName])

  const flyToHandlerRef = useRef<((req: FlyToRequest) => void) | null>(null)
  const lastFlyNonceRef = useRef<number | null>(null)
  useEffect(() => {
    if (!flyToRequest) return
    if (flyToRequest.nonce === lastFlyNonceRef.current) return
    // Only mark this request as handled once a live handler actually exists —
    // if the scene is being (re)created in this same commit, its setup effect
    // hasn't run yet, so leave the request unclaimed for its own catch-up check.
    if (flyToHandlerRef.current) {
      lastFlyNonceRef.current = flyToRequest.nonce
      flyToHandlerRef.current(flyToRequest)
    }
  }, [flyToRequest])

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

    const labelEl = document.createElement('div')
    labelEl.className = 'globe-label'
    labelEl.style.display = 'none'
    mount.appendChild(labelEl)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 3
    controls.maxDistance = 10
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.4

    let labelVisible = false
    let labelTarget: THREE.Vector3 | null = null
    let labelText = ''

    function hideLabel() {
      labelVisible = false
      labelEl.style.display = 'none'
    }

    function showLabelAt(position: THREE.Vector3, text: string) {
      labelTarget = position
      labelText = text
      labelEl.textContent = text
      labelVisible = true
    }

    // Manual dragging (but not the idle autoRotate, which never fires this
    // event) should hide the on-globe name label and stop the idle spin.
    controls.addEventListener('start', () => {
      hideLabel()
      controls.autoRotate = false
    })

    // Day/night shaded core sphere, with a warm terminator glow at the day/night line.
    // The normal is computed in WORLD space (mat3(modelMatrix)), not view space
    // (Three.js's built-in normalMatrix), so the terminator stays fixed to the
    // actual geography as the camera orbits, instead of rotating with the camera.
    const sunDirUniform = { value: new THREE.Vector3(1, 0, 0) }
    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: sunDirUniform,
        dayColor: { value: new THREE.Color(0x1c6f9c) },
        nightColor: { value: new THREE.Color(0x020610) },
        duskColor: { value: new THREE.Color(0xff9d5c) },
      },
      vertexShader: `
        varying vec3 vWorldNormal;
        void main() {
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        uniform vec3 dayColor;
        uniform vec3 nightColor;
        uniform vec3 duskColor;
        varying vec3 vWorldNormal;
        void main() {
          float intensity = dot(normalize(vWorldNormal), normalize(sunDirection));
          float dayMix = smoothstep(-0.08, 0.35, intensity);
          vec3 base = mix(nightColor, dayColor, dayMix);
          float terminator = 1.0 - smoothstep(0.0, 0.2, abs(intensity));
          base = mix(base, duskColor, terminator * 0.55);
          gl_FragColor = vec4(base, 1.0);
        }
      `,
    })
    const core = new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 0.985, 64, 48), coreMaterial)
    scene.add(core)

    // Graticule (lat/lon grid lines)
    const graticuleGroup = new THREE.Group()
    const graticuleMat = new THREE.LineBasicMaterial({
      color: GRATICULE_COLOR,
      transparent: true,
      opacity: GRATICULE_OPACITY,
    })
    const tzMat = new THREE.LineBasicMaterial({
      color: MERIDIAN_COLOR,
      transparent: true,
      opacity: MERIDIAN_OPACITY,
    })

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

    // Country border outlines (Natural Earth 110m, bundled at build time)
    const countryGeo = buildCountryBorderGeometry(RADIUS * 1.004)
    const countryMat = new THREE.LineBasicMaterial({
      color: COUNTRY_BORDER_COLOR,
      transparent: true,
      opacity: COUNTRY_BORDER_OPACITY,
    })
    scene.add(new THREE.LineSegments(countryGeo, countryMat))

    // Outer faint wireframe shell for a "globe of wire" silhouette
    const shellGeo = new THREE.SphereGeometry(RADIUS * 1.002, 24, 16)
    const shellMat = new THREE.MeshBasicMaterial({
      color: SHELL_COLOR,
      wireframe: true,
      transparent: true,
      opacity: SHELL_OPACITY,
    })
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

    // Highlight ring: repositioned to whatever city is currently selected,
    // whether or not it has its own permanent marker dot (search can select
    // any of ~7,300 cities, most of which aren't drawn as dots).
    const highlightMat = new THREE.MeshBasicMaterial({ color: 0x5fd0ff, transparent: true, opacity: 0.9 })
    const highlightMarker = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), highlightMat)
    highlightMarker.visible = false
    scene.add(highlightMarker)

    // User location marker (distinct color)
    let userMarker: THREE.Mesh | null = null
    if (userLocation) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x3fff9e })
      userMarker = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 16), mat)
      userMarker.position.copy(latLonToVector3(userLocation.lat, userLocation.lon, RADIUS * 1.015))
      scene.add(userMarker)
    }

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))

    // Camera fly-to: animate along the great-circle arc (not a straight lerp,
    // which would cut through the globe) so the target city ends up facing
    // the camera, then show its name label.
    let flightFrameId: number | null = null
    function flyTo(request: FlyToRequest) {
      if (flightFrameId !== null) cancelAnimationFrame(flightFrameId)
      hideLabel()
      controls.autoRotate = false
      controls.enabled = false

      const distance = camera.position.length()
      const startDir = camera.position.clone().normalize()
      const endDir = latLonToVector3(request.city.lat, request.city.lon, 1).normalize()
      const startTime = performance.now()

      const targetPos = latLonToVector3(request.city.lat, request.city.lon, RADIUS * 1.01)

      function step() {
        const t = Math.min((performance.now() - startTime) / FLY_DURATION_MS, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        const dir = slerpUnitVectors(startDir, endDir, eased)
        camera.position.copy(dir.multiplyScalar(distance))
        camera.lookAt(0, 0, 0)
        controls.update()
        if (t < 1) {
          flightFrameId = requestAnimationFrame(step)
        } else {
          flightFrameId = null
          controls.enabled = true
          highlightMarker.position.copy(targetPos)
          highlightMarker.visible = true
          showLabelAt(targetPos, `${request.city.name}, ${request.city.country}`)
        }
      }
      step()
    }
    flyToHandlerRef.current = flyTo
    // If a fly-to request already arrived in the same commit that recreated this
    // scene (e.g. geolocation resolving sets userLocation and the initial
    // nearest-city selection at once), the request-watcher effect below may run
    // before this ref is (re)assigned. Catch that race by flushing any pending,
    // not-yet-actioned request right here too.
    if (flyToRequest && flyToRequest.nonce !== lastFlyNonceRef.current) {
      lastFlyNonceRef.current = flyToRequest.nonce
      flyTo(flyToRequest)
    }

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
        const pos = latLonToVector3(city.lat, city.lon, RADIUS * 1.01)
        highlightMarker.position.copy(pos)
        highlightMarker.visible = true
        showLabelAt(pos, `${city.name}, ${city.country}`)
        return
      }

      const sphereHits = raycaster.intersectObject(hitSphere)
      if (sphereHits.length > 0) {
        const { lat, lon } = vector3ToLatLon(sphereHits[0].point, RADIUS)
        onSelectPoint(lat, lon)
        highlightMarker.visible = false
        hideLabel()
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

    const forward = new THREE.Vector3()
    const toCamera = new THREE.Vector3()
    const projected = new THREE.Vector3()

    let frameId: number
    function animate() {
      frameId = requestAnimationFrame(animate)

      const sun = subsolarPoint(new Date())
      const sunVec = latLonToVector3(sun.lat, sun.lon, 1)
      sunDirUniform.value.copy(sunVec)

      // Pulse the highlight marker gently for visibility
      const t = performance.now() / 500
      if (highlightMarker.visible) {
        highlightMarker.scale.setScalar(1.4 + Math.sin(t) * 0.25)
      }

      // Keep the floating name label positioned over its 3D marker, and hide
      // it if that point has rotated onto the back of the globe.
      if (labelVisible && labelTarget) {
        forward.copy(labelTarget).normalize()
        toCamera.copy(camera.position).sub(labelTarget).normalize()
        const facingCamera = forward.dot(toCamera) > 0.1
        if (!facingCamera) {
          labelEl.style.display = 'none'
        } else {
          projected.copy(labelTarget).project(camera)
          const x = (projected.x * 0.5 + 0.5) * mount!.clientWidth
          const y = (-projected.y * 0.5 + 0.5) * mount!.clientHeight
          labelEl.style.display = 'block'
          labelEl.style.transform = `translate(-50%, -130%) translate(${x}px, ${y}px)`
          labelEl.textContent = labelText
        }
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      if (flightFrameId !== null) cancelAnimationFrame(flightFrameId)
      flyToHandlerRef.current = null
      window.removeEventListener('resize', handleResize)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      renderer.domElement.removeEventListener('pointerup', handlePointerUp)
      renderer.domElement.removeEventListener('pointermove', handlePointerMove)
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      mount.removeChild(labelEl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation])

  return <div ref={mountRef} className="globe-mount" />
}
