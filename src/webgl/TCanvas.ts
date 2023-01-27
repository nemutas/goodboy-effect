import gsap from 'gsap'
import * as THREE from 'three'
import { gl } from './core/WebGL'
import { shaders } from './shaders'
import { Assets, loadAssets } from './utils/assetLoader'
import { calcCoveredTextureScale } from './utils/coveredTexture'

export class TCanvas {
  private tileParams = {
    amount: 30,
    size: 0.1,
  }
  private assets: Assets = {
    image1: { path: 'resources/wlop1.jpg' },
    image2: { path: 'resources/wlop2.jpg' },
    image3: { path: 'resources/wlop3.jpg' },
    image4: { path: 'resources/wlop4.jpg' },
  }
  private imageIndex = 0
  private images: THREE.Texture[] = []
  private isAnimating = false
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()

  constructor(private parentNode: ParentNode) {
    loadAssets(this.assets).then(() => {
      this.init()
      this.createScreen()
      this.createTiles()
      this.createDots()
      this.createLines()
      this.createIntersection()
      this.addEvents()
      gl.requestAnimationFrame(this.anime)
    })
  }

  private init() {
    gl.setup(this.parentNode.querySelector('.three-container')!)
    gl.scene.background = new THREE.Color('#000')
    gl.camera.position.z = 1

    const sceneScale = 1.1
    gl.scene.scale.set(sceneScale, sceneScale, sceneScale)

    Object.keys(this.assets).forEach((key) => {
      if (key.includes('image')) {
        this.images.push(this.assets[key].data as THREE.Texture)
      }
    })
  }

  private addEvents() {
    gl.setResizeCallback(this.handleResize)
    window.addEventListener('wheel', this.handleWheel)
  }

  private calcFillScreenSize(z = 0) {
    const theta = (gl.camera.fov / 2) * (Math.PI / 180)
    const height = 2 * (gl.camera.position.z - z) * Math.tan(theta)
    return { width: height * gl.size.aspect, height }
  }

  private createScreen() {
    const t1 = this.images[0]
    const s1 = calcCoveredTextureScale(t1, gl.size.aspect)
    const t2 = this.images[1]
    const s2 = calcCoveredTextureScale(t2, gl.size.aspect)

    const geometry = new THREE.PlaneGeometry()
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uImage: { value: { texture: t1, uvScale: new THREE.Vector2(s1[0], s1[1]) } },
        uNextImage: { value: { texture: t2, uvScale: new THREE.Vector2(s2[0], s2[1]) } },
        uSeed: { value: Math.random() },
        uAspect: { value: gl.size.aspect },
        uProgress: { value: 0 },
      },
      vertexShader: shaders.screen.vertex,
      fragmentShader: shaders.screen.fragment,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.name = 'screen'

    const { width, height } = this.calcFillScreenSize(mesh.position.z)
    mesh.scale.set(width, height, 1)

    gl.scene.add(mesh)
  }

  private createTiles() {
    const { amount, size } = this.tileParams
    const geometry = new THREE.PlaneGeometry()
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMouse: { value: new THREE.Vector3(99999, 99999) },
        uTime: { value: 0 },
      },
      vertexShader: shaders.tile.vertex,
      fragmentShader: shaders.tile.fragment,
      transparent: true,
      depthTest: false,
    })
    const instancedMesh = new THREE.InstancedMesh(geometry, material, amount ** 2)
    instancedMesh.name = 'tiles'

    const dummy = new THREE.Object3D()
    const offset = -(amount - 1) * 0.5 * size
    let counter = 0

    for (let x = 0; x < amount; x++) {
      for (let y = 0; y < amount; y++) {
        dummy.scale.set(size, size, 1)
        dummy.position.set(x * size + offset, y * size + offset, 0.001)
        dummy.updateMatrix()
        instancedMesh.setMatrixAt(counter++, dummy.matrix)
      }
    }
    instancedMesh.instanceMatrix.needsUpdate = true

    gl.scene.add(instancedMesh)
  }

  private createDots() {
    const amount = this.tileParams.amount + 1
    const positions: number[] = []

    const offset = -(amount - 1) * 0.5 * this.tileParams.size

    for (let x = 0; x < amount; x++) {
      for (let y = 0; y < amount; y++) {
        positions.push(x * this.tileParams.size + offset, y * this.tileParams.size + offset, 0.001)
      }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: shaders.dot.vertex,
      fragmentShader: shaders.dot.fragment,
      transparent: true,
    })
    const points = new THREE.Points(geometry, material)
    points.name = 'dots'
    gl.scene.add(points)
  }

  private createLines() {
    const amount = this.tileParams.amount + 1
    const legth = this.tileParams.amount * this.tileParams.size

    const offset = -(amount - 1) * 0.5 * this.tileParams.size

    const points = []
    for (let i = 0; i < amount; i++) {
      const x = i * this.tileParams.size + offset
      points.push(new THREE.Vector3(x, -legth / 2, 0))
      points.push(new THREE.Vector3(x, legth / 2, 0))
    }
    for (let i = 0; i < amount; i++) {
      const y = i * this.tileParams.size + offset
      points.push(new THREE.Vector3(-legth / 2, y, 0))
      points.push(new THREE.Vector3(legth / 2, y, 0))
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.15 })
    const lines = new THREE.LineSegments(geometry, material)
    lines.position.z = 0.001

    gl.scene.add(lines)
  }

  private createIntersection() {
    const size = this.tileParams.amount * this.tileParams.size
    const target = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial())

    window.addEventListener('mousemove', this.handleMousemove.bind(this, target))
  }

  private handleMousemove(target: THREE.Mesh, e: MouseEvent) {
    const x = (e.clientX / window.innerWidth) * 2 - 1
    const y = -(e.clientY / window.innerHeight) * 2 + 1
    this.pointer.set(x, y)

    this.raycaster.setFromCamera(this.pointer, gl.camera)
    const intersects = this.raycaster.intersectObjects([target])
    if (0 < intersects.length) {
      const tiles = gl.getMesh<THREE.ShaderMaterial>('tiles')
      tiles.material.uniforms.uMouse.value.copy(intersects[0].point)
    }
  }

  private handleResize = () => {
    const { width, height } = this.calcFillScreenSize()
    const screen = gl.getMesh<THREE.ShaderMaterial>('screen')
    screen.scale.set(width, height, 1)

    screen.material.uniforms.uAspect.value = gl.size.aspect

    const { texture: t1, uvScale: s1 } = screen.material.uniforms.uImage.value
    calcCoveredTextureScale(t1, gl.size.aspect, s1)

    const { texture: t2, uvScale: s2 } = screen.material.uniforms.uNextImage.value
    calcCoveredTextureScale(t2, gl.size.aspect, s2)
  }

  private handleWheel = (e: WheelEvent) => {
    if (this.isAnimating) return
    this.isAnimating = true

    if (0 < e.deltaY) {
      this.imageIndex < this.images.length - 1 ? this.imageIndex++ : (this.imageIndex = 0)
    } else {
      0 < this.imageIndex ? this.imageIndex-- : (this.imageIndex = this.images.length - 1)
    }

    const screen = gl.getMesh<THREE.ShaderMaterial>('screen')
    const unifroms = screen.material.uniforms

    unifroms.uNextImage.value.texture = this.images[this.imageIndex]
    calcCoveredTextureScale(unifroms.uNextImage.value.texture, gl.size.aspect, unifroms.uNextImage.value.uvScale)
    unifroms.uSeed.value = Math.random()

    gsap.fromTo(
      unifroms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration: 2,
        ease: 'power1.out',
        onComplete: () => {
          unifroms.uProgress.value = 0
          unifroms.uImage.value.texture = unifroms.uNextImage.value.texture
          calcCoveredTextureScale(unifroms.uImage.value.texture, gl.size.aspect, unifroms.uImage.value.uvScale)
          this.isAnimating = false
        },
      },
    )
  }

  // ----------------------------------
  // animation
  private anime = () => {
    const tiles = gl.getMesh<THREE.ShaderMaterial>('tiles')
    tiles.material.uniforms.uTime.value += gl.time.delta

    const dots = gl.getMesh<THREE.ShaderMaterial>('dots')
    dots.material.uniforms.uTime.value += gl.time.delta

    gl.scene.lookAt(this.pointer.x, this.pointer.y, 20)

    gl.render()
  }

  // ----------------------------------
  // dispose
  dispose() {
    gl.dispose()
  }
}
