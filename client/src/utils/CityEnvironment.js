import * as THREE from 'three';
import gsap from 'gsap';

export class CityEnvironment {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      2000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.setupRenderer();
    this.setupCamera();
    this.setupLights();
    this.setupEnvironment();

    // City state
    this.cityState = {
      aqi: 100,
      temperature: 25,
      hospitalLoad: 30,
      cropSupply: 70,
      riskLevel: 'low'
    };

    this.buildings = [];
    this.zones = {
      agriculture: [],
      health: [],
      industrial: [],
      residential: []
    };

    this.particles = null;
    this.fog = null;
    this.mouse = { x: 0, y: 0 };
    this.targetRotation = { x: 0, y: 0 };
    this.isAnimating = true;

    this.generateCity();
    this.setupEventListeners();
    this.animate();
  }

  setupRenderer() {
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setClearColor(0x0a0a1a, 1);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  setupCamera() {
    this.camera.position.set(0, 15, 25);
    this.camera.lookAt(0, 0, 0);
  }

  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (violet)
    const dirLight = new THREE.DirectionalLight(0xa78bfa, 0.8);
    dirLight.position.set(20, 30, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    this.scene.add(dirLight);

    // Secondary light (cyan)
    const pointLight = new THREE.PointLight(0x06b6d4, 0.6);
    pointLight.position.set(-20, 20, -20);
    this.scene.add(pointLight);

    // Warm light for heat effects
    this.heatLight = new THREE.PointLight(0xff6b35, 0);
    this.heatLight.position.set(0, 15, 0);
    this.scene.add(this.heatLight);
  }

  setupEnvironment() {
    // Fog - darker back, black front
    this.fog = new THREE.Fog(0x000000, 80, 150);
    this.scene.fog = this.fog;

    // Ground plane - black front, darker back
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add gradient background (darker back, black front)
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Create gradient: black at bottom (front), darker at top (back)
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#1a1a2e'); // Darker back
    gradient.addColorStop(1, '#000000'); // Black front
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    const texture = new THREE.CanvasTexture(canvas);
    this.scene.background = texture;

    // Ambient particles
    this.createAmbientParticles();
  }

  createAmbientParticles() {
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = Math.random() * 80;
      positions[i + 2] = (Math.random() - 0.5) * 200;

      velocities[i] = (Math.random() - 0.5) * 0.02;
      velocities[i + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i + 2] = (Math.random() - 0.5) * 0.02;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.PointsMaterial({
      color: 0xa78bfa,
      size: 0.3,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.3
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  generateCity() {
    // Create city blocks in a grid
    const blockSize = 8;
    const gridSize = 5;
    const spacing = 12;

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let z = -gridSize; z <= gridSize; z++) {
        const posX = x * spacing;
        const posZ = z * spacing;

        // Determine zone type
        const distFromCenter = Math.sqrt(x * x + z * z);
        let zoneType = 'residential';
        if (distFromCenter > 6) zoneType = 'agriculture';
        else if (distFromCenter > 4) zoneType = 'industrial';
        else if (Math.random() > 0.7) zoneType = 'health';

        // Generate buildings
        const buildingCount = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < buildingCount; i++) {
          const offsetX = (Math.random() - 0.5) * blockSize;
          const offsetZ = (Math.random() - 0.5) * blockSize;
          const building = this.createBuilding(
            posX + offsetX,
            posZ + offsetZ,
            zoneType
          );
          this.buildings.push(building);
          this.zones[zoneType].push(building);
          this.scene.add(building);
        }
      }
    }
  }

  createBuilding(x, z, zoneType) {
    const width = Math.random() * 2 + 1;
    const depth = Math.random() * 2 + 1;
    const height = Math.random() * 15 + 5;

    const geometry = new THREE.BoxGeometry(width, height, depth);

    let color;
    switch (zoneType) {
      case 'agriculture':
        color = 0x2d5016; // Dark green
        break;
      case 'health':
        color = 0x6b2d6b; // Purple
        break;
      case 'industrial':
        color = 0x3d2d5f; // Purple-tinted
        break;
      default:
        color = 0x1a0f2e; // Deep purple
    }

    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      metalness: 0.2,
      emissive: 0x7c3aed, // Purple emissive
      emissiveIntensity: 0.15
    });

    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    building.userData = {
      zoneType,
      baseColor: color,
      baseHeight: height,
      baseEmissive: 0.15
    };

    return building;
  }

  setupEventListeners() {
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('resize', () => this.onWindowResize());

    // Listen for scenario updates
    window.addEventListener('scenario-updated', (e) => {
      this.updateCityState(e.detail);
    });
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateCityState(scenarioData) {
    const newState = {
      aqi: scenarioData.intervention?.environmental_risk?.probability || this.cityState.aqi,
      temperature: scenarioData.intervention?.health_risk?.probability || this.cityState.temperature,
      hospitalLoad: scenarioData.intervention?.health_risk?.probability || this.cityState.hospitalLoad,
      cropSupply: scenarioData.intervention?.food_security_risk?.probability || this.cityState.cropSupply,
      riskLevel: this.calculateRiskLevel(scenarioData)
    };

    this.animateCityTransition(newState);
  }

  calculateRiskLevel(data) {
    const avgRisk = (
      (data.intervention?.environmental_risk?.probability || 0) +
      (data.intervention?.health_risk?.probability || 0) +
      (data.intervention?.food_security_risk?.probability || 0)
    ) / 3;

    if (avgRisk > 70) return 'critical';
    if (avgRisk > 50) return 'high';
    if (avgRisk > 30) return 'medium';
    return 'low';
  }

  animateCityTransition(newState) {
    // Animate fog based on AQI
    const targetFogFar = 150 - (newState.aqi / 500) * 100;
    gsap.to(this.fog, {
      far: targetFogFar,
      duration: 1.5,
      ease: 'power2.inOut'
    });

    // Animate heat light based on temperature
    const targetHeatIntensity = (newState.temperature / 50) * 0.8;
    gsap.to(this.heatLight, {
      intensity: targetHeatIntensity,
      duration: 1.5,
      ease: 'power2.inOut'
    });

    // Update building colors based on risk
    this.buildings.forEach(building => {
      const zoneType = building.userData.zoneType;
      let targetColor;

      if (zoneType === 'agriculture') {
        // Crop supply affects agriculture zones
        const cropHealth = newState.cropSupply / 100;
        targetColor = new THREE.Color().setHSL(0.3 * cropHealth, 0.6, 0.3);
      } else if (zoneType === 'health') {
        // Hospital load affects health zones
        const healthStress = newState.hospitalLoad / 100;
        targetColor = new THREE.Color().setHSL(0, healthStress * 0.5, 0.3 + healthStress * 0.2);
      } else {
        // General risk affects all zones
        const riskIntensity = newState.aqi / 500;
        targetColor = new THREE.Color().setHSL(0.8 - riskIntensity * 0.3, 0.5, 0.2 + riskIntensity * 0.1);
      }

      gsap.to(building.material.color, {
        r: targetColor.r,
        g: targetColor.g,
        b: targetColor.b,
        duration: 1.5,
        ease: 'power2.inOut'
      });

      // Pulse effect for high risk
      if (newState.riskLevel === 'critical' || newState.riskLevel === 'high') {
        gsap.to(building.material, {
          emissiveIntensity: 0.3,
          duration: 0.5,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut'
        });
      } else {
        gsap.to(building.material, {
          emissiveIntensity: building.userData.baseEmissive,
          duration: 1,
          ease: 'power2.inOut'
        });
      }
    });

    this.cityState = newState;
  }

  animate() {
    if (!this.isAnimating) return;

    requestAnimationFrame(() => this.animate());

    // Camera parallax based on mouse
    this.targetRotation.x += (this.mouse.y * 0.3 - this.targetRotation.x) * 0.05;
    this.targetRotation.y += (this.mouse.x * 0.3 - this.targetRotation.y) * 0.05;

    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.targetRotation.y;
    this.camera.rotation.x = this.targetRotation.x;

    // Slow camera drift
    const time = Date.now() * 0.0001;
    this.camera.position.x += Math.sin(time) * 0.01;
    this.camera.position.z += Math.cos(time) * 0.01;

    // Animate particles
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position.array;
      const velocities = this.particles.geometry.attributes.velocity.array;

      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];

        // Wrap around
        if (positions[i] > 100) positions[i] = -100;
        if (positions[i] < -100) positions[i] = 100;
        if (positions[i + 1] > 80) positions[i + 1] = 0;
        if (positions[i + 1] < 0) positions[i + 1] = 80;
        if (positions[i + 2] > 100) positions[i + 2] = -100;
        if (positions[i + 2] < -100) positions[i + 2] = 100;
      }

      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Subtle building animations
    this.buildings.forEach((building, index) => {
      const time = Date.now() * 0.0005;
      building.position.y += Math.sin(time + index) * 0.0005;
    });

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.isAnimating = false;
    this.renderer.dispose();
    this.buildings.forEach(b => b.geometry.dispose());
    if (this.particles) {
      this.particles.geometry.dispose();
    }
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
