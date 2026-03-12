'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function FloatingOrbs() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return
    const mount = mountRef.current
    const W = mount.clientWidth
    const H = mount.clientHeight

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 100)
    camera.position.z = 15

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Floating orbs
    const orbs: { mesh: THREE.Mesh; speed: number; offset: number; axis: THREE.Vector3 }[] = []
    const orbConfigs = [
      { r: 2.5, opacity: 0.08, x: -6, y: 3,  z: -5 },
      { r: 1.5, opacity: 0.06, x: 5,  y: -2, z: -3 },
      { r: 3.0, opacity: 0.05, x: 0,  y: -5, z: -8 },
      { r: 1.0, opacity: 0.10, x: 4,  y: 4,  z: -2 },
    ]

    orbConfigs.forEach((cfg, i) => {
      const geo  = new THREE.SphereGeometry(cfg.r, 32, 32)
      const mat  = new THREE.MeshPhongMaterial({
        color:       0xffffff,
        transparent: true,
        opacity:     cfg.opacity,
        wireframe:   i % 2 === 0,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(cfg.x, cfg.y, cfg.z)
      scene.add(mesh)
      orbs.push({
        mesh,
        speed:  0.003 + i * 0.001,
        offset: i * Math.PI * 0.5,
        axis:   new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(),
      })
    })

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)
    const point = new THREE.PointLight(0xffffff, 1, 50)
    point.position.set(5, 5, 5)
    scene.add(point)

    let raf: number
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      orbs.forEach(({ mesh, speed, offset, axis }) => {
        mesh.rotation.x = t * speed
        mesh.rotation.y = t * speed * 1.3
        mesh.position.y += Math.sin(t + offset) * 0.005
      })
      renderer.render(scene, camera)
    }
    animate()

    const onResize = () => {
      const w = mount.clientWidth; const h = mount.clientHeight
      camera.aspect = w / h; camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className='absolute inset-0 w-full h-full pointer-events-none' style={{ zIndex: 0 }} />
}
