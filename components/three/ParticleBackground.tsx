'use client'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleBackground() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return

    const mount = mountRef.current
    const width  = mount.clientWidth
    const height = mount.clientHeight

    // Scene
    const scene    = new THREE.Scene()
    const camera   = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.z = 30

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Particles
    const count  = 1800
    const geo    = new THREE.BufferGeometry()
    const pos    = new Float32Array(count * 3)
    const sizes  = new Float32Array(count)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 80
      pos[i * 3 + 1] = (Math.random() - 0.5) * 80
      pos[i * 3 + 2] = (Math.random() - 0.5) * 40
      sizes[i]  = Math.random() * 1.5 + 0.3
      speeds[i] = Math.random() * 0.003 + 0.001
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('size',     new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime:    { value: 0 },
        uPixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform float uPixelRatio;
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.5 + position.x * 0.1) * 0.3;
          pos.x += cos(uTime * 0.3 + position.y * 0.1) * 0.2;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * uPixelRatio * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.2, 0.5, d);
          gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.5);
        }
      `,
      transparent: true,
      depthWrite:  false,
    })

    const points = new THREE.Points(geo, mat)
    scene.add(points)

    // Mouse parallax
    let mouseX = 0, mouseY = 0
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.5
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5
    }
    window.addEventListener('mousemove', onMouseMove)

    // Animation loop
    let raf: number
    const clock = new THREE.Clock()
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = clock.getElapsedTime()
      mat.uniforms.uTime.value = t
      points.rotation.y = t * 0.02 + mouseX
      points.rotation.x = mouseY * 0.3
      renderer.render(scene, camera)
    }
    animate()

    // Resize
    const onResize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className='absolute inset-0 w-full h-full pointer-events-none'
      style={{ zIndex: 0 }}
    />
  )
}
