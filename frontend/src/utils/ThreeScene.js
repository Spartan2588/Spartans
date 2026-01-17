import * as THREE from 'three';
import gsap from 'gsap';

export class ThreeScene {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      particleCount: 150,
      meshType: 'floating', // 'floating' or 'wireframe'
      ...config
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    this.setupRenderer();
    this.setupCamera();
    this.setupLights();
    this.setupEventListeners();
    
    this.particles = [];
    this.meshes = [];
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };
    this.isAnimating = true;

    this.animate();
  }

  setupRenderer() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera.position.z = 5;
  }

  setupLights() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0xa78bfa, 1.2);
    pointLight1.position.set(5, 5, 5);
    pointLight1.castShadow = true;
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 0.8);
    pointLight2.position.set(-5, -5, 5);
    this.scene.add(pointLight2);
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => this.onWindowResize());
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  createParticles(count = this.config.particleCount) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;

      // Gradient colors
      const t = i / (count * 3);
      colors[i] = 0.65 + t * 0.35; // R
      colors[i + 1] = 0.55 + t * 0.45; // G
      colors[i + 2] = 0.98; // B
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.08,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6,
      vertexColors: true
    });

    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    this.particles.push(particles);

    return particles;
  }

  createFloatingMesh() {
    const geometry = new THREE.IcosahedronGeometry(2, 4);
    const material = new THREE.MeshPhongMaterial({
      color: 0xa78bfa,
      emissive: 0x7c3aed,
      wireframe: false,
      transparent: true,
      opacity: 0.7,
      shininess: 100
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    this.scene.add(mesh);
    this.meshes.push(mesh);

    return mesh;
  }

  createWireframeGeometry() {
    const geometry = new THREE.TorusGeometry(3, 1, 16, 100);
    const material = new THREE.MeshPhongMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    this.meshes.push(mesh);

    return mesh;
  }

  createTerrainGrid() {
    const geometry = new THREE.PlaneGeometry(20, 20, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x1e1e3f,
      emissive: 0x2d2d5f,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 4;
    mesh.position.z = -5;
    this.scene.add(mesh);
    this.meshes.push(mesh);

    return mesh;
  }

  animate() {
    if (!this.isAnimating) return;

    requestAnimationFrame(() => this.animate());

    // Smooth camera movement
    this.targetRotation.x += (this.mouse.y * 0.3 - this.targetRotation.x) * 0.05;
    this.targetRotation.y += (this.mouse.x * 0.3 - this.targetRotation.y) * 0.05;

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.targetRotation.y;
    this.camera.rotation.x = this.targetRotation.x;

    // Animate particles
    this.particles.forEach((particle) => {
      particle.rotation.x += 0.0001;
      particle.rotation.y += 0.0002;
    });

    // Animate meshes
    this.meshes.forEach((mesh) => {
      mesh.rotation.x += 0.0005;
      mesh.rotation.y += 0.0008;
      mesh.position.y += Math.sin(Date.now() * 0.0005) * 0.001;
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isAnimating = false;
    this.renderer.dispose();
    this.particles.forEach(p => p.geometry.dispose());
    this.meshes.forEach(m => m.geometry.dispose());
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
