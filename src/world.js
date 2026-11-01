import * as THREE from 'three';

// ============================================================================
// ATMOS x ROMANTIC GARDEN 3D WORLD
// 3D Wooden Garden Signboards + 3D Wedding Pelaminan Backdrop (Faris & Vita)
// ============================================================================

export class GardenWorld {
  constructor(canvas) {
    this.canvas = canvas;
    this.scrollProgress = 0;      // Target scroll [0..1]
    this.smoothProgress = 0;      // Smoothed scroll [0..1]
    this.pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.gateOpenProgress = 0;    // [0..1]
    this.walkCycle = 0;

    // Detect mobile and low-spec hardware to scale budgets smoothly
    const isMobile = typeof navigator !== 'undefined' && (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (typeof window !== 'undefined' && window.innerWidth < 768));
    const isLowSpec = isMobile || (typeof navigator !== 'undefined' && ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4)));
    this.isMobile = isMobile;
    this.isLowSpec = isLowSpec;

    // Zero-allocation reusable vectors and colors for 60fps render loop
    this._couplePos = new THREE.Vector3();
    this._coupleTangent = new THREE.Vector3();
    this._camPos = new THREE.Vector3();
    this._cTop = new THREE.Color();
    this._cMid = new THREE.Color();
    this._cHor = new THREE.Color();
    this._cFog = new THREE.Color();

    this.parsedStages = [
      { top: new THREE.Color('#133394'), mid: new THREE.Color('#6b88e6'), hor: new THREE.Color('#ffdfc2'), fog: new THREE.Color('#7b95eb') },
      { top: new THREE.Color('#1d3c8c'), mid: new THREE.Color('#7d8be3'), hor: new THREE.Color('#ffc89e'), fog: new THREE.Color('#8b95e3') },
      { top: new THREE.Color('#262973'), mid: new THREE.Color('#7d6bc4'), hor: new THREE.Color('#f5a6b8'), fog: new THREE.Color('#7c6bc2') },
      { top: new THREE.Color('#141c4f'), mid: new THREE.Color('#45579e'), hor: new THREE.Color('#f3c677'), fog: new THREE.Color('#3f5194') }
    ];

    this.clock = new THREE.Clock();
    this.floatingFrames = [];
    this.cloudGroups = [];
    this.treeCrowns = [];

    this.initRenderer();
    this.initSceneAndCamera();
    this.initSplinePath();
    this.initSkyAndLights();
    this.buildTerrainAndRibbonPath();
    this.buildAtmosClouds();
    this.buildEntranceGate();
    this.buildWeddingCouple();
    this.build3DWoodenSignboards();
    this.buildTreesAndFlowers();
    this.buildLanternsAndFrames();
    this.buildSanctuaryGazebo();
    this.buildFirefliesAndPetals();

    this.boundResize = () => this.handleResize();
    this.handleResize();
    window.addEventListener('resize', this.boundResize);
    this.initPointerParallax();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isLowSpec,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      precision: this.isLowSpec ? 'mediump' : 'highp'
    });
    const maxDpr = this.isLowSpec ? 1.0 : (this.isMobile ? 1.25 : 1.75);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
  }

  initSceneAndCamera() {
    this.scene = new THREE.Scene();
    this.fogColor = new THREE.Color('#6f8ce0');
    this.scene.fog = new THREE.FogExp2(this.fogColor, 0.011);

    const isPortrait = window.innerWidth < window.innerHeight;
    this.baseFov = isPortrait ? 62 : 48;
    this.camera = new THREE.PerspectiveCamera(
      this.baseFov,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    );
  }

  initSplinePath() {
    this.curvePoints = [
      new THREE.Vector3(0.0, 1.8, 10.0),    // t=0.00: Camera start before Gate
      new THREE.Vector3(0.0, 1.8, -4.0),    // t=0.12: Past Gate (Stop 01 Quote)
      new THREE.Vector3(-4.2, 2.2, -28.0),  // t=0.28: Stop 02 Mempelai (Faris & Vita)
      new THREE.Vector3(4.4, 2.6, -54.0),   // t=0.46: Stop 03 Love Story
      new THREE.Vector3(-4.0, 2.2, -80.0),  // t=0.64: Stop 04 3D Photo Gallery
      new THREE.Vector3(2.6, 2.0, -104.0),  // t=0.80: Stop 05 Akad & Resepsi
      new THREE.Vector3(0.0, 2.0, -124.0),  // t=0.90: Stop 06 Gazebo Altar (Couple turns & waves)
      new THREE.Vector3(0.0, 2.0, -142.0)   // t=1.00: Forward horizon extension
    ];
    this.cameraCurve = new THREE.CatmullRomCurve3(this.curvePoints, false, 'catmullrom', 0.5);
  }

  initSkyAndLights() {
    const skyGeo = new THREE.SphereGeometry(175, 32, 24);
    this.skyUniforms = {
      uTopColor: { value: new THREE.Color('#133394') },
      uMidColor: { value: new THREE.Color('#6b88e6') },
      uHorizonColor: { value: new THREE.Color('#ffdfc2') },
      uSunPos: { value: new THREE.Vector3(0.0, 0.14, -1.0) }
    };

    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = normalize(worldPosition.xyz);
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        uniform vec3 uSunPos;
        varying vec3 vWorldPosition;

        void main() {
          float h = clamp(vWorldPosition.y * 0.85 + 0.15, 0.0, 1.0);
          vec3 col = mix(uHorizonColor, uMidColor, smoothstep(0.0, 0.42, h));
          col = mix(col, uTopColor, smoothstep(0.42, 0.92, h));

          float sunAmt = max(dot(vWorldPosition, normalize(uSunPos)), 0.0);
          col += vec3(1.0, 0.88, 0.72) * pow(sunAmt, 10.0) * 0.38;
          col += vec3(1.0, 0.96, 0.9) * pow(sunAmt, 64.0) * 0.45;

          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);

    this.ambientLight = new THREE.HemisphereLight('#ffffff', '#4a5f9e', 1.5);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight('#fff2db', 1.9);
    this.sunLight.position.set(14, 30, -35);
    this.scene.add(this.sunLight);
  }

  // ==========================================================================
  // PROCEDURAL BOTANICAL GRASS, MOSS & TRAVERTINE WALKWAY TEXTURES
  // ==========================================================================
  createLushGrassTextures() {
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 512;
    colorCanvas.height = 512;
    const ctx = colorCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d');

    // Rich botanical soil & deep turf base
    ctx.fillStyle = '#2d5a3f';
    ctx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = '#404040';
    bCtx.fillRect(0, 0, 512, 512);

    // Organic soft moss & sunlit meadow patches
    for (let p = 0; p < 85; p++) {
      const px = (p * 73) % 512;
      const py = (p * 137) % 512;
      const rad = 28 + (p % 5) * 14;
      const grad = ctx.createRadialGradient(px, py, 2, px, py, rad);
      if (p % 3 === 0) {
        grad.addColorStop(0, 'rgba(72, 128, 78, 0.35)');
        grad.addColorStop(1, 'rgba(72, 128, 78, 0)');
      } else if (p % 3 === 1) {
        grad.addColorStop(0, 'rgba(32, 68, 46, 0.38)');
        grad.addColorStop(1, 'rgba(32, 68, 46, 0)');
      } else {
        grad.addColorStop(0, 'rgba(95, 142, 82, 0.25)');
        grad.addColorStop(1, 'rgba(95, 142, 82, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thousands of fine individual grass blades & clover micro-details
    const bladeColors = ['#244933', '#2e5d41', '#3b734e', '#4d8a5b', '#629e67', '#1e3d2a'];
    for (let i = 0; i < 4200; i++) {
      const x = (i * 97 + (i % 13) * 19) % 512;
      const y = (i * 53 + (i % 7) * 31) % 512;
      const len = 5 + (i % 5) * 2.5;
      const angle = -Math.PI * 0.5 + ((i % 11) - 5) * 0.14;

      ctx.strokeStyle = bladeColors[i % bladeColors.length];
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(
        x + Math.cos(angle) * len * 0.5,
        y + Math.sin(angle) * len * 0.5,
        x + Math.cos(angle + 0.18) * len,
        y + Math.sin(angle + 0.18) * len
      );
      ctx.stroke();

      // Matching bump height stroke
      bCtx.strokeStyle = i % 2 === 0 ? '#c8c8c8' : '#888888';
      bCtx.lineWidth = 1.3;
      bCtx.beginPath();
      bCtx.moveTo(x, y);
      bCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
      bCtx.stroke();
    }

    const colorTex = new THREE.CanvasTexture(colorCanvas);
    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.wrapS = THREE.RepeatWrapping;
    colorTex.wrapT = THREE.RepeatWrapping;
    colorTex.repeat.set(38, 52);

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(38, 52);

    return { colorTex, bumpTex };
  }

  createTravertinePathTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm limestone / travertine base
    ctx.fillStyle = '#e7dfd1';
    ctx.fillRect(0, 0, 512, 512);

    // Cut flagstone paver grid with subtle warm stone variation
    const rows = 8;
    const rowH = 512 / rows;
    const stoneTones = ['#ece5d8', '#e2d8c7', '#dfd4c1', '#f1ebe0', '#d9ceba'];

    for (let r = 0; r < rows; r++) {
      const y = r * rowH;
      const offset = (r % 2) * 80;
      const cols = 4;
      const colW = 512 / cols;
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset;
        ctx.fillStyle = stoneTones[(r * 3 + c + 10) % stoneTones.length];
        ctx.fillRect(x + 3, y + 3, colW - 6, rowH - 6);

        // Soft stone mortar groove
        ctx.strokeStyle = 'rgba(115, 102, 84, 0.42)';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, colW - 4, rowH - 4);
      }
    }

    // Left & right sculpted stone curb borders with mossy edge shadow
    ctx.fillStyle = '#cfc3ae';
    ctx.fillRect(0, 0, 44, 512);
    ctx.fillRect(512 - 44, 0, 44, 512);

    ctx.strokeStyle = 'rgba(90, 78, 62, 0.65)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(44, 0);
    ctx.lineTo(44, 512);
    ctx.moveTo(512 - 44, 0);
    ctx.lineTo(512 - 44, 512);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 56);
    return tex;
  }

  createGrassTuftGeometry() {
    // 5 crossed & gracefully curved 3D grass blades per tuft with root-to-tip vertex colors
    const geometries = [];
    const bladeCount = 5;

    for (let b = 0; b < bladeCount; b++) {
      const angle = (b / bladeCount) * Math.PI * 2 + (b % 2) * 0.25;
      const tilt = 0.22 + (b % 3) * 0.14;
      const h = 0.26 + (b % 3) * 0.08;
      const w = 0.048;

      const plane = new THREE.PlaneGeometry(w, h, 1, 3);
      const pos = plane.attributes.position;
      const colors = new Float32Array(pos.count * 3);

      const cRoot = new THREE.Color('#1d3e2a');
      const cTip = new THREE.Color(b % 2 === 0 ? '#68ab6c' : '#85bf78');
      const cTemp = new THREE.Color();

      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i) + h * 0.5; // base at y = 0
        const frac = THREE.MathUtils.clamp(vy / h, 0, 1);

        // Taper width toward top tip and curve outward
        const taper = 1.0 - Math.pow(frac, 1.4) * 0.88;
        const bend = Math.pow(frac, 1.8) * tilt * h;

        const lx = vx * taper;
        const lz = bend;

        // Rotate blade around Y by angle
        const rx = lx * Math.cos(angle) - lz * Math.sin(angle);
        const rz = lx * Math.sin(angle) + lz * Math.cos(angle);

        pos.setXYZ(i, rx, vy, rz);

        cTemp.copy(cRoot).lerp(cTip, frac);
        colors[i * 3] = cTemp.r;
        colors[i * 3 + 1] = cTemp.g;
        colors[i * 3 + 2] = cTemp.b;
      }

      plane.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      plane.computeVertexNormals();
      geometries.push(plane);
    }

    // Merge the 5 blades into a single BufferGeometry
    const totalVerts = geometries.reduce((acc, g) => acc + g.attributes.position.count, 0);
    const mergedPos = new Float32Array(totalVerts * 3);
    const mergedNorm = new Float32Array(totalVerts * 3);
    const mergedCol = new Float32Array(totalVerts * 3);
    const mergedIndices = [];

    let vOffset = 0;
    geometries.forEach((g) => {
      const p = g.attributes.position.array;
      const n = g.attributes.normal.array;
      const c = g.attributes.color.array;
      mergedPos.set(p, vOffset * 3);
      mergedNorm.set(n, vOffset * 3);
      mergedCol.set(c, vOffset * 3);

      const idx = g.getIndex().array;
      for (let i = 0; i < idx.length; i++) {
        mergedIndices.push(idx[i] + vOffset);
      }
      vOffset += g.attributes.position.count;
    });

    const tuftGeo = new THREE.BufferGeometry();
    tuftGeo.setAttribute('position', new THREE.BufferAttribute(mergedPos, 3));
    tuftGeo.setAttribute('normal', new THREE.BufferAttribute(mergedNorm, 3));
    tuftGeo.setAttribute('color', new THREE.BufferAttribute(mergedCol, 3));
    tuftGeo.setIndex(mergedIndices);
    return tuftGeo;
  }

  getTerrainHeightAt(vx, vz) {
    const tempVec = new THREE.Vector3();
    const approxT = THREE.MathUtils.clamp((10.0 - vz) / 152.0, 0, 1);
    this.cameraCurve.getPointAt(approxT, tempVec);
    const distFromPath = Math.abs(vx - tempVec.x);

    const pathFloorY = tempVec.y - 1.8;
    // Multi-octave organic botanical hill undulation
    const primaryHill = Math.sin(vx * 0.13) * Math.cos(vz * 0.09) * 1.55 + Math.sin(vz * 0.055) * 0.68;
    const microMound = Math.sin(vx * 0.38 + vz * 0.22) * 0.24 + Math.cos(vx * 0.27 - vz * 0.31) * 0.16;
    const hillWave = primaryHill + microMound;

    const gazeboFlatness = vz < -112 ? THREE.MathUtils.smoothstep(distFromPath, 6.8, 14.5) : 1.0;
    const hillBlend = THREE.MathUtils.smoothstep(distFromPath, 2.3, 10.5) * gazeboFlatness;

    // Subtle sunken garden bed contour right outside the stone curb
    const curbDip = -0.05 * Math.exp(-Math.pow((distFromPath - 1.55) / 0.45, 2)) * gazeboFlatness;

    return {
      y: pathFloorY + hillWave * hillBlend + curbDip,
      distFromPath,
      hillWave: hillWave * hillBlend
    };
  }

  buildTerrainAndRibbonPath() {
    // 1. Sculpted Botanical Garden Terrain with Procedural Grass + Bump + Vertex Colors
    const groundSegmentsX = this.isLowSpec ? 56 : 112;
    const groundSegmentsZ = this.isLowSpec ? 74 : 148;
    const groundGeo = new THREE.PlaneGeometry(165, 215, groundSegmentsX, groundSegmentsZ);
    groundGeo.rotateX(-Math.PI / 2);

    const pos = groundGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    const cPathEdgeLawn = new THREE.Color('#c8e8b4');  // Sunlit manicured lawn near path
    const cMidMeadow = new THREE.Color('#9ec998');     // Rich emerald garden turf
    const cDeepWoodland = new THREE.Color('#689470');  // Shaded woodland moss under trees
    const cHillCrest = new THREE.Color('#dcefc2');     // Warm sunlit hill crests
    const cVert = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i) - 68;
      pos.setZ(i, vz);

      const { y, distFromPath, hillWave } = this.getTerrainHeightAt(vx, vz);
      pos.setY(i, y);

      // Blend vertex colors by distance from walkway and elevation
      const midFactor = THREE.MathUtils.smoothstep(distFromPath, 1.4, 5.5);
      const outerFactor = THREE.MathUtils.smoothstep(distFromPath, 5.5, 14.0);
      const crestFactor = THREE.MathUtils.clamp((hillWave - 0.35) * 0.45, 0, 0.65);

      cVert.copy(cPathEdgeLawn)
        .lerp(cMidMeadow, midFactor)
        .lerp(cDeepWoodland, outerFactor)
        .lerp(cHillCrest, crestFactor);

      colors[i * 3] = cVert.r;
      colors[i * 3 + 1] = cVert.g;
      colors[i * 3 + 2] = cVert.b;
    }

    groundGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    groundGeo.computeVertexNormals();

    const { colorTex: grassTex, bumpTex: grassBump } = this.createLushGrassTextures();
    const groundMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      bumpMap: grassBump,
      bumpScale: 0.085,
      vertexColors: true,
      roughness: 0.86,
      metalness: 0.03
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    this.scene.add(groundMesh);

    // 2. Realistic Cut-Travertine Stone Garden Walkway + Silk Wedding Aisle Runner
    const ribbonSamples = this.isLowSpec ? 140 : 280;
    const stoneGeo = new THREE.BufferGeometry();
    const stoneVerts = new Float32Array(ribbonSamples * 2 * 3);
    const stoneUvs = new Float32Array(ribbonSamples * 2 * 2);

    const ribbonGeo = new THREE.BufferGeometry();
    const ribbonVerts = new Float32Array(ribbonSamples * 2 * 3);
    const ribbonUvs = new Float32Array(ribbonSamples * 2 * 2);
    const ribbonIndices = [];

    const pt = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const sideNormal = new THREE.Vector3();
    const stoneHalfWidth = 1.28;
    const silkHalfWidth = 0.82;

    for (let i = 0; i < ribbonSamples; i++) {
      const t = (i / (ribbonSamples - 1)) * 0.93;
      this.cameraCurve.getPointAt(t, pt);
      this.cameraCurve.getTangentAt(t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const stoneY = pt.y - 1.785;
      const silkY = pt.y - 1.76;

      const vIdx = i * 6;
      // Stone walkway vertices
      stoneVerts[vIdx] = pt.x - sideNormal.x * stoneHalfWidth;
      stoneVerts[vIdx + 1] = stoneY;
      stoneVerts[vIdx + 2] = pt.z - sideNormal.z * stoneHalfWidth;
      stoneVerts[vIdx + 3] = pt.x + sideNormal.x * stoneHalfWidth;
      stoneVerts[vIdx + 4] = stoneY;
      stoneVerts[vIdx + 5] = pt.z + sideNormal.z * stoneHalfWidth;

      // Silk wedding runner vertices
      ribbonVerts[vIdx] = pt.x - sideNormal.x * silkHalfWidth;
      ribbonVerts[vIdx + 1] = silkY;
      ribbonVerts[vIdx + 2] = pt.z - sideNormal.z * silkHalfWidth;
      ribbonVerts[vIdx + 3] = pt.x + sideNormal.x * silkHalfWidth;
      ribbonVerts[vIdx + 4] = silkY;
      ribbonVerts[vIdx + 5] = pt.z + sideNormal.z * silkHalfWidth;

      const uIdx = i * 4;
      stoneUvs[uIdx] = 0;
      stoneUvs[uIdx + 1] = t;
      stoneUvs[uIdx + 2] = 1;
      stoneUvs[uIdx + 3] = t;

      ribbonUvs[uIdx] = 0;
      ribbonUvs[uIdx + 1] = t;
      ribbonUvs[uIdx + 2] = 1;
      ribbonUvs[uIdx + 3] = t;

      if (i < ribbonSamples - 1) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        ribbonIndices.push(a, b, c, b, d, c);
      }
    }

    stoneGeo.setAttribute('position', new THREE.BufferAttribute(stoneVerts, 3));
    stoneGeo.setAttribute('uv', new THREE.BufferAttribute(stoneUvs, 2));
    stoneGeo.setIndex(ribbonIndices);
    stoneGeo.computeVertexNormals();

    const travertineTex = this.createTravertinePathTexture();
    const stoneMat = new THREE.MeshStandardMaterial({
      map: travertineTex,
      bumpMap: travertineTex,
      bumpScale: 0.04,
      roughness: 0.68,
      metalness: 0.06
    });
    const stoneWalkwayMesh = new THREE.Mesh(stoneGeo, stoneMat);
    this.scene.add(stoneWalkwayMesh);

    ribbonGeo.setAttribute('position', new THREE.BufferAttribute(ribbonVerts, 3));
    ribbonGeo.setAttribute('uv', new THREE.BufferAttribute(ribbonUvs, 2));
    ribbonGeo.setIndex(ribbonIndices);
    ribbonGeo.computeVertexNormals();

    const ribbonMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      uniforms: {
        uColorCenter: { value: new THREE.Color('#fffaf0') },
        uColorEdge: { value: new THREE.Color('#f3c677') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColorCenter;
        uniform vec3 uColorEdge;
        varying vec2 vUv;
        void main() {
          float distFromCenter = abs(vUv.x - 0.5) * 2.0;
          float glow = smoothstep(1.0, 0.12, distFromCenter);
          vec3 col = mix(uColorEdge, uColorCenter, glow);
          float outerGoldTrim = smoothstep(0.94, 0.88, distFromCenter) - smoothstep(0.88, 0.82, distFromCenter);
          float innerGoldTrim = smoothstep(0.78, 0.74, distFromCenter) - smoothstep(0.74, 0.70, distFromCenter);
          col += vec3(1.0, 0.86, 0.52) * (outerGoldTrim * 0.65 + innerGoldTrim * 0.35);
          gl_FragColor = vec4(col, smoothstep(1.0, 0.90, distFromCenter) * 0.94);
        }
      `
    });

    const ribbonMesh = new THREE.Mesh(ribbonGeo, ribbonMat);
    this.scene.add(ribbonMesh);

    // 3. Instanced 3D Botanical Grass Blade Tufts along Walkway & Hills (Stopped before Gazebo)
    const tuftGeo = this.createGrassTuftGeometry();
    const tuftMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.65,
      metalness: 0.02,
      side: THREE.DoubleSide
    });
    const tuftCount = this.isLowSpec ? 380 : 900;
    const tuftInst = new THREE.InstancedMesh(tuftGeo, tuftMat, tuftCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < tuftCount; i++) {
      // Stop at t = 0.80 (well before Gazebo plaza & stairs at z = -117)
      const t = 0.01 + ((i * 29) % tuftCount) / tuftCount * 0.79;
      this.cameraCurve.getPointAt(t, pt);
      this.cameraCurve.getTangentAt(t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const side = i % 2 === 0 ? 1 : -1;
      // Dense band near stone curb (1.35m..3.2m) + scattered across rolling hills (3.2m..11m)
      const band = i % 3 !== 0
        ? 1.32 + ((i * 17) % 20) * 0.095
        : 3.1 + ((i * 31) % 30) * 0.26;

      const gx = pt.x + sideNormal.x * side * band;
      const gz = pt.z + sideNormal.z * side * band;
      const { y: gy } = this.getTerrainHeightAt(gx, gz);

      // Keep Gazebo zone (z < -115.5) completely clear of 3D grass tufts
      if (gz < -115.5 || Math.hypot(gx, gz + 124.2) < 8.5) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(gx, gy - 0.02, gz);
        dummy.rotation.set(0, (i * 1.7) % (Math.PI * 2), 0);
        const s = 0.75 + (i % 5) * 0.22;
        dummy.scale.set(s, s * (0.85 + (i % 3) * 0.18), s);
      }
      dummy.updateMatrix();
      tuftInst.setMatrixAt(i, dummy.matrix);
    }
    this.scene.add(tuftInst);

    // 4. Sculpted Natural Granite & Sandstone Boulders along the Path Edge (Stopped before Gazebo)
    const rockGeo = new THREE.DodecahedronGeometry(0.32, 1);
    const rPos = rockGeo.attributes.position;
    for (let i = 0; i < rPos.count; i++) {
      const rx = rPos.getX(i);
      const ry = rPos.getY(i);
      const rz = rPos.getZ(i);
      const n = 1.0 + Math.sin(rx * 7.0 + ry * 5.0) * 0.16 + Math.cos(rz * 6.0) * 0.12;
      rPos.setXYZ(i, rx * n, ry * n * 0.68, rz * n);
    }
    rockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      bumpMap: grassBump,
      bumpScale: 0.05,
      roughness: 0.86,
      metalness: 0.04
    });
    const rockPalette = [
      new THREE.Color('#a8a096'), // Warm Granite Grey
      new THREE.Color('#c2b8aa'), // Light Travertine Stone
      new THREE.Color('#8c857b'), // River Cobble Grey-Taupe
      new THREE.Color('#b3a99c'), // Warm Sandstone
      new THREE.Color('#78726a')  // Charcoal Slate Stone
    ];
    const rockCount = this.isLowSpec ? 50 : 110;
    const rockInst = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);

    for (let i = 0; i < rockCount; i++) {
      // Stop at t = 0.80 so no rocks appear near or inside Gazebo
      const t = 0.02 + (i / rockCount) * 0.78;
      this.cameraCurve.getPointAt(t, pt);
      this.cameraCurve.getTangentAt(t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const side = (i % 2 === 0 ? 1 : -1) * (i % 5 === 0 ? -1 : 1);
      const dist = 1.42 + ((i * 19) % 12) * 0.35;
      const rx = pt.x + sideNormal.x * side * dist;
      const rz = pt.z + sideNormal.z * side * dist;
      const { y: ry } = this.getTerrainHeightAt(rx, rz);

      if (rz < -115.5 || Math.hypot(rx, rz + 124.2) < 8.5) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(rx, ry - 0.04, rz);
        dummy.rotation.set((i * 0.3) % 0.4, (i * 2.1) % (Math.PI * 2), (i * 0.25) % 0.4);
        const sx = 0.55 + (i % 4) * 0.32;
        const sy = 0.45 + (i % 3) * 0.24;
        const sz = 0.6 + ((i + 2) % 4) * 0.28;
        dummy.scale.set(sx, sy, sz);
      }
      dummy.updateMatrix();
      rockInst.setMatrixAt(i, dummy.matrix);
      rockInst.setColorAt(i, rockPalette[i % rockPalette.length]);
    }
    rockInst.instanceColor.needsUpdate = true;
    this.scene.add(rockInst);
  }

  // ==========================================================================
  // REALISTIC VOLUMETRIC CUMULUS SKY CLOUDS (HIGH ALTITUDE + 3-TIER SHADING)
  // ==========================================================================
  createSculptedCloudPuffGeometry() {
    const geo = new THREE.IcosahedronGeometry(1.0, 3);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      // Multi-octave cauliflower cumulus billow displacement
      const billow =
        Math.sin(vx * 3.4 + vy * 2.8) * 0.14 +
        Math.cos(vz * 3.8 - vx * 2.6) * 0.12 +
        Math.sin((vx + vy + vz) * 5.8) * 0.06;

      // Real cumulus clouds have a flat condensation base at the bottom and puffy domes on top
      const yProfile = vy < 0 ? 0.38 : 0.88;
      const r = 1.0 + billow;

      pos.setXYZ(i, vx * r * 1.24, vy * r * yProfile, vz * r * 1.15);
    }

    geo.computeVertexNormals();
    return geo;
  }

  createSoftCloudWispTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 124);
    grad.addColorStop(0.0, 'rgba(255, 252, 248, 0.72)');
    grad.addColorStop(0.45, 'rgba(244, 247, 255, 0.42)');
    grad.addColorStop(0.78, 'rgba(215, 226, 250, 0.12)');
    grad.addColorStop(1.0, 'rgba(215, 226, 250, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  buildAtmosClouds() {
    const puffGeo = this.createSculptedCloudPuffGeometry();
    const wispTex = this.createSoftCloudWispTexture();

    // 3-Tier Cumulus Cloud Shading: Sunlit Crown, Crisp Mid-Body, Cool Shadowed Under-Base
    const topCloudMat = new THREE.MeshStandardMaterial({
      color: '#fffdf9',
      emissive: '#ffdcb8',
      emissiveIntensity: 0.28,
      roughness: 0.78,
      metalness: 0.01
    });
    const midCloudMat = new THREE.MeshStandardMaterial({
      color: '#f2f6ff',
      emissive: '#7892de',
      emissiveIntensity: 0.22,
      roughness: 0.84,
      metalness: 0.01
    });
    const baseCloudMat = new THREE.MeshStandardMaterial({
      color: '#c3d0ee',
      emissive: '#415594',
      emissiveIntensity: 0.25,
      roughness: 0.90,
      metalness: 0.01
    });
    const wispSpriteMat = new THREE.SpriteMaterial({
      map: wispTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.58
    });

    const buildCumulusCluster = (seed, overallScale) => {
      const cluster = new THREE.Group();

      // 1. Flat Shadowed Cumulus Under-Base Layer
      const basePuffs = [
        { x: -1.8, y: -0.55, z: 0.2, sx: 2.1, sy: 0.95, sz: 1.75 },
        { x: 0.0, y: -0.60, z: 0.0, sx: 2.5, sy: 1.0, sz: 2.0 },
        { x: 1.85, y: -0.52, z: -0.2, sx: 2.0, sy: 0.92, sz: 1.7 },
        { x: 0.7, y: -0.50, z: 1.05, sx: 1.65, sy: 0.85, sz: 1.45 }
      ];
      basePuffs.forEach((p, idx) => {
        const m = new THREE.Mesh(puffGeo, baseCloudMat);
        m.position.set(p.x, p.y, p.z);
        m.scale.set(p.sx, p.sy, p.sz);
        m.rotation.y = (seed + idx) * 1.1;
        cluster.add(m);
      });

      // 2. Voluminous Mid-Body Cumulus Lobes
      const midPuffs = [
        { x: -1.35, y: 0.15, z: 0.15, sx: 1.85, sy: 1.45, sz: 1.65 },
        { x: 0.1, y: 0.28, z: -0.1, sx: 2.25, sy: 1.75, sz: 1.95 },
        { x: 1.45, y: 0.10, z: 0.12, sx: 1.75, sy: 1.38, sz: 1.55 },
        { x: -0.55, y: 0.22, z: 0.92, sx: 1.45, sy: 1.22, sz: 1.35 },
        { x: 0.85, y: 0.18, z: -0.82, sx: 1.5, sy: 1.25, sz: 1.35 }
      ];
      midPuffs.forEach((p, idx) => {
        const m = new THREE.Mesh(puffGeo, midCloudMat);
        m.position.set(p.x, p.y, p.z);
        m.scale.set(p.sx, p.sy, p.sz);
        m.rotation.y = (seed * 1.7 + idx) * 0.9;
        cluster.add(m);
      });

      // 3. Towering Sunlit Cauliflower Cumulus Tops
      const topPuffs = [
        { x: -0.45, y: 1.05, z: 0.08, sx: 1.48, sy: 1.35, sz: 1.38 },
        { x: 0.42, y: 1.25, z: -0.05, sx: 1.62, sy: 1.52, sz: 1.48 },
        { x: 1.15, y: 0.78, z: 0.18, sx: 1.18, sy: 1.05, sz: 1.12 },
        { x: -1.1, y: 0.72, z: -0.15, sx: 1.15, sy: 1.02, sz: 1.08 }
      ];
      topPuffs.forEach((p, idx) => {
        const m = new THREE.Mesh(puffGeo, topCloudMat);
        m.position.set(p.x, p.y, p.z);
        m.scale.set(p.sx, p.sy, p.sz);
        m.rotation.y = (seed * 2.3 + idx) * 1.2;
        cluster.add(m);
      });

      // 4. Soft Vapor Halo Wisps around the Cloud Perimeter
      const wispOffsets = [
        { x: -2.2, y: -0.1, z: 0.3, s: 5.2 },
        { x: 0.0, y: 0.45, z: 0.4, s: 6.4 },
        { x: 2.1, y: -0.05, z: -0.2, s: 5.0 }
      ];
      wispOffsets.forEach((w) => {
        const sprite = new THREE.Sprite(wispSpriteMat);
        sprite.position.set(w.x, w.y, w.z);
        sprite.scale.set(w.s * 1.35, w.s * 0.85, 1);
        cluster.add(sprite);
      });

      cluster.scale.setScalar(overallScale);
      return cluster;
    };

    const pt = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const sideNormal = new THREE.Vector3();

    // High-Altitude Sky Corridor Clouds (All high above the trees: y = 13.5m to 30m)
    const cloudCount = this.isLowSpec ? 16 : 38;
    for (let i = 0; i < cloudCount; i++) {
      const t = 0.02 + (i / cloudCount) * 0.94;
      this.cameraCurve.getPointAt(t, pt);
      this.cameraCurve.getTangentAt(t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const side = i % 2 === 0 ? 1 : -1;
      // Spread wide across the upper sky dome (some closer overhead, some further out)
      const dist = 6.5 + ((i * 13) % 7) * 4.2;
      // Guaranteed high sky altitude: 12.5m to 26.5m above the spline!
      const cy = pt.y + 12.5 + ((i * 7) % 5) * 3.2;
      const cx = pt.x + sideNormal.x * side * dist;
      const cz = pt.z + sideNormal.z * side * dist;

      const overallScale = 1.05 + (i % 4) * 0.38;
      const cluster = buildCumulusCluster(i, overallScale);
      cluster.position.set(cx, cy, cz);
      cluster.rotation.y = (i * 0.85) % (Math.PI * 2);

      this.scene.add(cluster);
      this.cloudGroups.push({
        group: cluster,
        baseX: cx,
        baseY: cy,
        phase: i * 0.9,
        driftSpeed: 0.18 + (i % 3) * 0.08
      });
    }

    // Grand Distant Horizon Sky Clouds behind the Gazebo Sanctuary (High in the sky)
    const horizonCount = this.isLowSpec ? 4 : 10;
    for (let h = 0; h < horizonCount; h++) {
      const angle = ((h / Math.max(1, horizonCount - 1)) - 0.5) * Math.PI * 0.85;
      const radius = 42 + (h % 3) * 12;
      const hx = Math.sin(angle) * radius;
      const hz = -124.0 - Math.cos(angle) * radius;
      const hy = 16.5 + (h % 4) * 4.2;

      const scale = 1.65 + (h % 3) * 0.45;
      const cluster = buildCumulusCluster(h + 50, scale);
      cluster.position.set(hx, hy, hz);
      cluster.rotation.y = -angle;

      this.scene.add(cluster);
      this.cloudGroups.push({
        group: cluster,
        baseX: hx,
        baseY: hy,
        phase: h * 1.3,
        driftSpeed: 0.14
      });
    }
  }

  // ==========================================================================
  // 3D WOODEN GARDEN SIGNBOARDS (PAPAN KAYU UKIR + BUNGA DI PINGGIR JALAN)
  // ==========================================================================
  createWoodBoardTexture(lines, align = 'center') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');

    // 1. Rich Dark Teak / Walnut Wood Grain Background
    const woodGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    woodGrad.addColorStop(0, '#2c1b12');
    woodGrad.addColorStop(0.5, '#3b2417');
    woodGrad.addColorStop(1, '#24150d');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle horizontal wood grain streaks & plank grooves
    ctx.strokeStyle = 'rgba(18, 9, 4, 0.38)';
    ctx.lineWidth = 3;
    for (let y = 12; y < canvas.height; y += 18) {
      ctx.beginPath();
      ctx.moveTo(0, y + Math.sin(y) * 4);
      ctx.bezierCurveTo(
        canvas.width * 0.33, y + 8,
        canvas.width * 0.66, y - 8,
        canvas.width, y + Math.cos(y) * 4
      );
      ctx.stroke();
    }

    // Horizontal plank divider lines
    ctx.strokeStyle = 'rgba(10, 5, 2, 0.65)';
    ctx.lineWidth = 4;
    for (let py = 192; py < canvas.height; py += 192) {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();
    }

    // 2. Ornate Gold Double Border Frame inside the Wooden Sign
    ctx.strokeStyle = '#e5c384';
    ctx.lineWidth = 6;
    ctx.strokeRect(32, 32, canvas.width - 64, canvas.height - 64);

    ctx.strokeStyle = 'rgba(229, 195, 132, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 46, canvas.width - 92, canvas.height - 92);

    // Corner gold diamond accents
    const corners = [
      [32, 32],
      [canvas.width - 32, 32],
      [32, canvas.height - 32],
      [canvas.width - 32, canvas.height - 32]
    ];
    ctx.fillStyle = '#f3c677';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Crisp Engraved/Painted Typography
    ctx.textAlign = align;
    const xPos = align === 'center' ? 512 : align === 'right' ? 920 : 104;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    let currentY = 135;
    lines.forEach((line) => {
      ctx.font = line.font || '400 40px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = line.color || '#fff9f0';
      ctx.fillText(line.text, xPos, currentY);
      currentY += line.lineHeight || 62;
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }

  create3DWoodenSignboard(lines, widthMeters = 3.1, heightMeters = 2.25) {
    const group = new THREE.Group();

    const postWoodMat = new THREE.MeshStandardMaterial({
      color: '#29180f',
      roughness: 0.82,
      metalness: 0.06
    });
    const frameWoodMat = new THREE.MeshStandardMaterial({
      color: '#3a2216',
      roughness: 0.76,
      metalness: 0.08
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#f3c677',
      roughness: 0.28,
      metalness: 0.85
    });

    // 1. Two Sturdy Wooden Support Posts planted in the ground
    const postHeight = heightMeters + 1.15;
    const postGeo = new THREE.BoxGeometry(0.14, postHeight, 0.14);
    const leftPost = new THREE.Mesh(postGeo, postWoodMat);
    leftPost.position.set(-widthMeters * 0.44, postHeight * 0.5 - 0.1, -0.06);
    const rightPost = new THREE.Mesh(postGeo, postWoodMat);
    rightPost.position.set(widthMeters * 0.44, postHeight * 0.5 - 0.1, -0.06);

    // Gold finial caps on top of the wooden posts
    const capGeo = new THREE.SphereGeometry(0.1, 12, 12);
    const leftCap = new THREE.Mesh(capGeo, goldMat);
    leftCap.position.set(-widthMeters * 0.44, postHeight - 0.05, -0.06);
    const rightCap = new THREE.Mesh(capGeo, goldMat);
    rightCap.position.set(widthMeters * 0.44, postHeight - 0.05, -0.06);

    group.add(leftPost, rightPost, leftCap, rightCap);

    // 2. Thick 3D Wooden Backing Board + Top Roof Overhang
    const boardY = 0.85 + heightMeters * 0.5;
    const backingBoard = new THREE.Mesh(
      new THREE.BoxGeometry(widthMeters + 0.16, heightMeters + 0.16, 0.1),
      frameWoodMat
    );
    backingBoard.position.set(0, boardY, 0);

    // Pitched mini wooden roof trim on top of the signboard
    const roofTrim = new THREE.Mesh(
      new THREE.BoxGeometry(widthMeters + 0.36, 0.12, 0.26),
      postWoodMat
    );
    roofTrim.position.set(0, boardY + heightMeters * 0.5 + 0.1, 0.02);

    // 3. Textured Front Wood Face (Opaque, High-Contrast & Self-Lit so always readable)
    const tex = this.createWoodBoardTexture(lines, 'center');
    const faceMat = new THREE.MeshBasicMaterial({ map: tex });
    const facePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(widthMeters, heightMeters),
      faceMat
    );
    facePlane.position.set(0, boardY, 0.055);

    // 4. Floral Garland Clusters decorating the top corners of the wooden sign
    const flowerColors = ['#ffb7c5', '#fff2d6', '#f48fb1', '#ffe082'];
    const flowerGeo = new THREE.DodecahedronGeometry(0.14, 0);
    for (let i = 0; i < 6; i++) {
      const blossom = new THREE.Mesh(
        flowerGeo,
        new THREE.MeshBasicMaterial({ color: flowerColors[i % flowerColors.length] })
      );
      const side = i < 3 ? -1 : 1;
      const idx = i % 3;
      blossom.position.set(
        side * (widthMeters * 0.46 - idx * 0.18),
        boardY + heightMeters * 0.5 + 0.06 - idx * 0.05,
        0.1
      );
      group.add(blossom);
    }

    group.add(backingBoard, roofTrim, facePlane);
    return group;
  }

  build3DWoodenSignboards() {
    const waypoints = [
      {
        t: 0.14,
        side: 1,
        offset: 2.35,
        lines: [
          { text: 'AWAL PERJALANAN', font: '500 28px monospace', color: '#f3c677', lineHeight: 76 },
          { text: '“Let me just waking up', font: 'italic 500 52px Georgia, serif', color: '#ffffff', lineHeight: 68 },
          { text: 'together with you”', font: 'italic 500 52px Georgia, serif', color: '#ffffff', lineHeight: 82 },
          { text: 'Ardhito Pramono', font: 'italic 400 34px Georgia, serif', color: '#f3c677', lineHeight: 48 },
          { text: 'Waking Up Together With You', font: '400 26px sans-serif', color: '#f5e3be', lineHeight: 50 }
        ]
      },
      {
        t: 0.29,
        side: -1,
        offset: 2.35,
        lines: [
          { text: 'THE BRIDE & GROOM', font: '500 28px monospace', color: '#f3c677', lineHeight: 58 },
          { text: 'Faris Rizqilail', font: 'italic 600 50px Georgia, serif', color: '#ffffff', lineHeight: 52 },
          { text: 'Putra kedua Bapak Dadang Indarto & Ibu Agustin Sulistyorini', font: '400 27px sans-serif', color: '#f5e3be', lineHeight: 66 },
          { text: '&', font: 'italic 400 44px Georgia, serif', color: '#f3c677', lineHeight: 58 },
          { text: 'Ardina Vita Rika Pratiwi', font: 'italic 600 50px Georgia, serif', color: '#ffffff', lineHeight: 52 },
          { text: 'Putri dari Bapak Hariyanto dan Ibu Retno Soelistyowati', font: '400 27px sans-serif', color: '#f5e3be', lineHeight: 50 }
        ]
      },
      {
        t: 0.45,
        side: 1,
        offset: 2.35,
        lines: [
          { text: 'KISAH CINTA KAMI', font: '500 28px monospace', color: '#f3c677', lineHeight: 60 },
          { text: 'Oktober 2023 • Pertemuan Pertama', font: '600 40px Georgia, serif', color: '#ffffff', lineHeight: 46 },
          { text: 'Awal mula perjalanan kisah cinta kami.', font: '400 30px sans-serif', color: '#f5e3be', lineHeight: 64 },
          { text: 'September 2026 • Komitmen & Lamaran', font: '600 40px Georgia, serif', color: '#ffffff', lineHeight: 46 },
          { text: 'Mengikat janji bersama kedua keluarga.', font: '400 30px sans-serif', color: '#f5e3be', lineHeight: 64 },
          { text: '10 Januari 2027 • Ikatan Suci', font: '600 40px Georgia, serif', color: '#f3c677', lineHeight: 46 }
        ]
      },
      {
        t: 0.74,
        side: -1,
        offset: 2.35,
        lines: [
          { text: 'WAKTU & TEMPAT', font: '500 28px monospace', color: '#f3c677', lineHeight: 58 },
          { text: 'Minggu, 10 Januari 2027', font: '600 48px Georgia, serif', color: '#ffffff', lineHeight: 64 },
          { text: 'Akad Nikah: 08.00 s/d 10.00 WIB', font: '500 34px sans-serif', color: '#f3c677', lineHeight: 52 },
          { text: 'Resepsi Pernikahan: 11.00 s/d 14.00 WIB', font: '500 34px sans-serif', color: '#f3c677', lineHeight: 64 },
          { text: 'Gedung Bangsal Pancasila UWKS', font: '600 36px sans-serif', color: '#ffffff', lineHeight: 48 },
          { text: 'Surabaya, Jawa Timur', font: '400 32px sans-serif', color: '#f5e3be', lineHeight: 46 }
        ]
      }
    ];

    const pt = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const sideNormal = new THREE.Vector3();

    waypoints.forEach((wp) => {
      this.cameraCurve.getPointAt(wp.t, pt);
      this.cameraCurve.getTangentAt(wp.t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const signGroup = this.create3DWoodenSignboard(wp.lines, 3.1, 2.25);
      const wx = pt.x + sideNormal.x * wp.side * wp.offset;
      const wz = pt.z + sideNormal.z * wp.side * wp.offset;
      const wy = pt.y - 1.8; // Base planted on garden floor

      signGroup.position.set(wx, wy, wz);
      // Angle the wooden signboard toward the approaching camera
      signGroup.lookAt(pt.x - tangent.x * 5.2, wy, pt.z - tangent.z * 5.2);

      this.scene.add(signGroup);
    });
  }

  // ==========================================================================
  // ROBLOX WEDDING AVATAR BUILDER (BEVELED CYLINDER HEAD + BLOCKY R6 LIMBS)
  // ==========================================================================
  createRobloxHeadTexture(isBride = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm Roblox skin tone base
    ctx.fillStyle = '#f6d2b4';
    ctx.fillRect(0, 0, 512, 512);

    // In Three.js CylinderGeometry, UV u=0.5 faces +Z (back) or -Z depending on rotation.
    // We center the face at x = 256 (u = 0.5) and rotate head mesh so u=0.5 faces local -Z (front).
    const cx = 256;
    const cy = 265;

    // 1. Soft Rosy Blush Cheeks
    ctx.fillStyle = 'rgba(255, 130, 155, 0.45)';
    ctx.beginPath();
    ctx.ellipse(cx - 58, cy + 22, 22, 13, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 58, cy + 22, 22, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Classic Roblox Glossy Oval Eyes
    ctx.fillStyle = '#181412';
    ctx.beginPath();
    ctx.ellipse(cx - 38, cy - 12, 13, 19, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 38, cy - 12, 13, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute Eyelashes for Bride
    if (isBride) {
      ctx.strokeStyle = '#181412';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 48, cy - 24);
      ctx.lineTo(cx - 57, cy - 31);
      ctx.moveTo(cx + 48, cy - 24);
      ctx.lineTo(cx + 57, cy - 31);
      ctx.stroke();
    }

    // White Eye Catchlights (Roblox signature shine)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx - 42, cy - 19, 5.5, 0, Math.PI * 2);
    ctx.arc(cx + 34, cy - 19, 5.5, 0, Math.PI * 2);
    ctx.arc(cx - 34, cy - 6, 2.8, 0, Math.PI * 2);
    ctx.arc(cx + 42, cy - 6, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 3. Expressive Roblox Eyebrows
    ctx.strokeStyle = '#2b1d16';
    ctx.lineWidth = isBride ? 5 : 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx - 38, cy - 24, 18, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 38, cy - 24, 18, Math.PI * 1.18, Math.PI * 1.82);
    ctx.stroke();

    // 4. Classic Joyful Roblox Smile
    ctx.strokeStyle = isBride ? '#c94458' : '#241612';
    ctx.lineWidth = 6.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy + 12, 30, 0.22 * Math.PI, 0.78 * Math.PI);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createRobloxGroomTorsoMaterials() {
    // Front Tuxedo Texture
    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = 512;
    frontCanvas.height = 512;
    const fCtx = frontCanvas.getContext('2d');

    // Midnight Navy/Black Tuxedo Base
    fCtx.fillStyle = '#151d30';
    fCtx.fillRect(0, 0, 512, 512);

    // Crisp White Dress Shirt V-Plastron
    fCtx.fillStyle = '#ffffff';
    fCtx.beginPath();
    fCtx.moveTo(150, 0);
    fCtx.lineTo(362, 0);
    fCtx.lineTo(256, 360);
    fCtx.closePath();
    fCtx.fill();

    // Satin Lapels
    fCtx.strokeStyle = '#253252';
    fCtx.lineWidth = 22;
    fCtx.beginPath();
    fCtx.moveTo(145, 0);
    fCtx.lineTo(256, 365);
    fCtx.lineTo(367, 0);
    fCtx.stroke();

    // Gold Tuxedo Buttons & Pocket Square
    fCtx.fillStyle = '#f3c677';
    [150, 215, 280, 395, 445].forEach((by) => {
      fCtx.beginPath();
      fCtx.arc(256, by, 9, 0, Math.PI * 2);
      fCtx.fill();
    });

    // White & Gold Pocket Handkerchief
    fCtx.fillStyle = '#f3c677';
    fCtx.fillRect(345, 145, 68, 12);

    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.colorSpace = THREE.SRGBColorSpace;

    // Back Tuxedo Texture
    const backCanvas = document.createElement('canvas');
    backCanvas.width = 512;
    backCanvas.height = 512;
    const bCtx = backCanvas.getContext('2d');
    bCtx.fillStyle = '#151d30';
    bCtx.fillRect(0, 0, 512, 512);
    // White collar rim at top of back
    bCtx.fillStyle = '#ffffff';
    bCtx.fillRect(0, 0, 512, 26);
    // Subtle center suit seam & belt line
    bCtx.strokeStyle = '#0d1322';
    bCtx.lineWidth = 6;
    bCtx.beginPath();
    bCtx.moveTo(256, 26);
    bCtx.lineTo(256, 512);
    bCtx.stroke();

    const backTex = new THREE.CanvasTexture(backCanvas);
    backTex.colorSpace = THREE.SRGBColorSpace;

    const sideMat = new THREE.MeshStandardMaterial({ color: '#151d30', roughness: 0.5 });
    const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.45 });
    const backMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.5 });

    // BoxGeometry material order: [+x, -x, +y, -y, +z (back), -z (front)]
    return [sideMat, sideMat, sideMat, sideMat, backMat, frontMat];
  }

  createRobloxBrideTorsoMaterials() {
    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = 512;
    frontCanvas.height = 512;
    const ctx = frontCanvas.getContext('2d');

    // Skin upper chest / neckline
    ctx.fillStyle = '#f6d2b4';
    ctx.fillRect(0, 0, 512, 130);

    // Pearl Necklace
    ctx.strokeStyle = '#f3c677';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(256, 20, 95, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Sweetheart White Satin Corset Bodice
    ctx.fillStyle = '#fffdf9';
    ctx.beginPath();
    ctx.moveTo(0, 120);
    ctx.quadraticCurveTo(140, 75, 256, 135);
    ctx.quadraticCurveTo(372, 75, 512, 120);
    ctx.lineTo(512, 512);
    ctx.lineTo(0, 512);
    ctx.closePath();
    ctx.fill();

    // Gold Lace Embroidery Trim & Waist Sash
    ctx.strokeStyle = '#f3c677';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 124);
    ctx.quadraticCurveTo(140, 80, 256, 140);
    ctx.quadraticCurveTo(372, 80, 512, 124);
    ctx.stroke();

    ctx.fillStyle = '#f3c677';
    ctx.fillRect(0, 445, 512, 67);

    const frontTex = new THREE.CanvasTexture(frontCanvas);
    frontTex.colorSpace = THREE.SRGBColorSpace;

    const sideMat = new THREE.MeshStandardMaterial({ color: '#fffdf9', roughness: 0.35 });
    const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.35 });

    return [sideMat, sideMat, sideMat, sideMat, frontMat, frontMat];
  }

  buildRobloxHeadGeometry() {
    // Classic Roblox Cylindrical Head with smooth beveled top and bottom curves
    const points = [
      new THREE.Vector2(0.0, -0.17),
      new THREE.Vector2(0.11, -0.17),
      new THREE.Vector2(0.155, -0.145),
      new THREE.Vector2(0.172, -0.10),
      new THREE.Vector2(0.172, 0.10),
      new THREE.Vector2(0.155, 0.145),
      new THREE.Vector2(0.11, 0.17),
      new THREE.Vector2(0.0, 0.17)
    ];
    return new THREE.LatheGeometry(points, 32);
  }

  buildWeddingCouple() {
    // ========================================================================
    // POLISHED ROBLOX BRIDE & GROOM AVATARS (FARIS & VITA)
    // ========================================================================
    this.coupleGroup = new THREE.Group();

    const suitMat = new THREE.MeshStandardMaterial({ color: '#151d30', roughness: 0.5, metalness: 0.12 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: '#101726', roughness: 0.55 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#0c0f17', roughness: 0.3, metalness: 0.25 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 });
    const skinMat = new THREE.MeshStandardMaterial({ color: '#f6d2b4', roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: '#1c1512', roughness: 0.65 });
    const goldMat = new THREE.MeshStandardMaterial({ color: '#f3c677', roughness: 0.25, metalness: 0.85 });
    const dressMat = new THREE.MeshPhysicalMaterial({
      color: '#fffdf9',
      emissive: '#384675',
      emissiveIntensity: 0.1,
      roughness: 0.3,
      clearcoat: 0.4
    });
    const veilMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.55,
      roughness: 0.25,
      side: THREE.DoubleSide
    });

    const robloxHeadGeo = this.buildRobloxHeadGeometry();

    // ====================================================
    // 1. ROBLOX GROOM AVATAR (Faris — Left Side x = -0.42)
    // ====================================================
    this.groom = new THREE.Group();
    this.groom.position.set(-0.42, 0, 0);

    // Blocky Roblox Legs (Left & Right)
    const buildRobloxLeg = (legColorMat, footColorMat) => {
      const legGroup = new THREE.Group();
      const upperLeg = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.42, 0.22), legColorMat);
      upperLeg.position.y = -0.21;
      const shoeBlock = new THREE.Mesh(new THREE.BoxGeometry(0.215, 0.11, 0.24), footColorMat);
      shoeBlock.position.set(0, -0.46, -0.01);
      legGroup.add(upperLeg, shoeBlock);
      return legGroup;
    };

    this.groomLeftLeg = buildRobloxLeg(pantsMat, shoeMat);
    this.groomLeftLeg.position.set(-0.115, 0.52, 0);

    this.groomRightLeg = buildRobloxLeg(pantsMat, shoeMat);
    this.groomRightLeg.position.set(0.115, 0.52, 0);

    // Blocky Roblox Torso with Tuxedo Texture + 3D Bow Tie & Boutonniere
    const groomTorso = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.50, 0.23),
      this.createRobloxGroomTorsoMaterials()
    );
    groomTorso.position.y = 0.77;

    const bowTie = new THREE.Group();
    bowTie.position.set(0, 0.96, -0.125);
    const knot = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.025), goldMat);
    const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.048, 0.02), goldMat);
    leftWing.position.x = -0.04;
    const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.048, 0.02), goldMat);
    rightWing.position.x = 0.04;
    bowTie.add(knot, leftWing, rightWing);

    const boutonniere = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.035, 0),
      new THREE.MeshBasicMaterial({ color: '#ff8da1' })
    );
    boutonniere.position.set(-0.12, 0.89, -0.125);

    // Blocky Roblox Arms (Tuxedo Sleeve + White Cuff + Blocky Hand)
    const buildGroomArm = () => {
      const armGroup = new THREE.Group();
      const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.36, 0.20), suitMat);
      sleeve.position.y = -0.16;
      const cuff = new THREE.Mesh(new THREE.BoxGeometry(0.204, 0.035, 0.204), shirtMat);
      cuff.position.y = -0.35;
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.12, 0.19), skinMat);
      hand.position.y = -0.42;
      armGroup.add(sleeve, cuff, hand);
      return armGroup;
    };

    this.groomLeftArm = buildGroomArm();
    this.groomLeftArm.position.set(-0.335, 0.99, 0);

    this.groomRightArm = buildGroomArm();
    this.groomRightArm.position.set(0.335, 0.99, 0);
    this.groomRightArm.rotation.z = -0.22;

    // Cylindrical Beveled Roblox Head + Face Decal + Stylized 3D Roblox Hair
    this.groomHeadGroup = new THREE.Group();
    this.groomHeadGroup.position.y = 1.21;

    const groomHeadMesh = new THREE.Mesh(robloxHeadGeo, skinMat);

    // Stylized Blocky-Layered Roblox Groom Hair
    const groomHairGroup = new THREE.Group();
    const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.11, 0.36), hairMat);
    hairTop.position.set(0, 0.16, 0.01);
    const hairCrown = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.07, 0.32), hairMat);
    hairCrown.position.set(0.02, 0.21, 0);
    hairCrown.rotation.z = -0.08;
    const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.24, 0.12), hairMat);
    hairBack.position.set(0, 0.05, 0.13);
    const hairSideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.32), hairMat);
    hairSideL.position.set(-0.155, 0.08, 0.02);
    const hairSideR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 0.32), hairMat);
    hairSideR.position.set(0.155, 0.08, 0.02);
    // Front swept fringe bangs (leaving eyes & smile clearly visible)
    const hairBangs = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.07, 0.09), hairMat);
    hairBangs.position.set(0.03, 0.14, -0.15);
    hairBangs.rotation.z = -0.12;
    groomHairGroup.add(hairTop, hairCrown, hairBack, hairSideL, hairSideR, hairBangs);

    this.groomHeadGroup.add(groomHeadMesh, groomHairGroup);

    this.groom.add(
      this.groomLeftLeg,
      this.groomRightLeg,
      groomTorso,
      bowTie,
      boutonniere,
      this.groomLeftArm,
      this.groomRightArm,
      this.groomHeadGroup
    );

    // ====================================================
    // 2. ROBLOX BRIDE AVATAR (Vita — Right Side x = +0.42)
    // ====================================================
    this.bride = new THREE.Group();
    this.bride.position.set(0.42, 0, 0);

    // Blocky Roblox Legs for Bride (walking underneath gown)
    this.brideLeftLeg = buildRobloxLeg(skinMat, dressMat);
    this.brideLeftLeg.position.set(-0.11, 0.52, 0);

    this.brideRightLeg = buildRobloxLeg(skinMat, dressMat);
    this.brideRightLeg.position.set(0.11, 0.52, 0);

    // Tiered Blocky/Pleated Roblox Wedding Gown Skirt + Back Ribbon Bow
    this.brideSkirt = new THREE.Group();
    this.brideSkirt.position.y = 0.56;

    const skirtTier1 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.20, 0.34), dressMat);
    skirtTier1.position.y = -0.08;
    const skirtTier2 = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.22, 0.42), dressMat);
    skirtTier2.position.y = -0.26;
    const skirtTier3 = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.20, 0.50), dressMat);
    skirtTier3.position.set(0, -0.44, 0.03);
    const goldHem = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.035, 0.51), goldMat);
    goldHem.position.set(0, -0.53, 0.03);

    // Cute 3D Gold Waist Bow on the back of the Bride's Gown
    const backBow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.12, 0.08), goldMat);
    backBow.position.set(0, 0.02, 0.16);

    this.brideSkirt.add(skirtTier1, skirtTier2, skirtTier3, goldHem, backBow);

    // Blocky Roblox Bride Torso
    const brideTorso = new THREE.Mesh(
      new THREE.BoxGeometry(0.43, 0.48, 0.22),
      this.createRobloxBrideTorsoMaterials()
    );
    brideTorso.position.y = 0.76;

    // Blocky Roblox Bride Arms (White Puff Sleeve + Skin Forearm/Hand)
    const buildBrideArm = () => {
      const armGroup = new THREE.Group();
      const puffSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.18, 0.21), dressMat);
      puffSleeve.position.y = -0.07;
      const forearm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 0.18), skinMat);
      forearm.position.y = -0.29;
      const bracelet = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.03, 0.19), goldMat);
      bracelet.position.y = -0.36;
      armGroup.add(puffSleeve, forearm, bracelet);
      return armGroup;
    };

    this.brideLeftArm = buildBrideArm();
    this.brideLeftArm.position.set(-0.32, 0.98, 0);
    this.brideLeftArm.rotation.z = 0.22;

    this.brideRightArm = buildBrideArm();
    this.brideRightArm.position.set(0.32, 0.98, 0);
    this.brideRightArm.rotation.z = -0.15;
    this.brideRightArm.rotation.x = -0.38;

    // 3D Roblox Wedding Flower Bouquet in Bride's Right Hand
    const bouquet = new THREE.Group();
    bouquet.position.set(0.0, -0.44, -0.10);
    const stemWrap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.08), goldMat);
    stemWrap.position.y = -0.05;
    bouquet.add(stemWrap);

    const bouquetColors = ['#ff9ebb', '#fff5d6', '#f48fb1', '#ffe082', '#ffffff'];
    for (let f = 0; f < 7; f++) {
      const rose = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.085, 0.085),
        new THREE.MeshBasicMaterial({ color: bouquetColors[f % bouquetColors.length] })
      );
      const a = (f / 7) * Math.PI * 2;
      rose.position.set(Math.cos(a) * 0.065, 0.04 + (f % 2) * 0.03, Math.sin(a) * 0.065);
      rose.rotation.set(a, a, 0);
      bouquet.add(rose);
    }
    this.brideRightArm.add(bouquet);

    // Cylindrical Beveled Roblox Bride Head + Hair + Golden Tiara Crown
    this.brideHeadGroup = new THREE.Group();
    this.brideHeadGroup.position.y = 1.19;

    const brideHeadMesh = new THREE.Mesh(robloxHeadGeo, skinMat);

    // Sculpted Blocky Roblox Bride Hair + Side Locks + Back Chignon Bun
    const brideHairGroup = new THREE.Group();
    const bHairTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.10, 0.36), hairMat);
    bHairTop.position.set(0, 0.155, 0.01);
    const bHairBack = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.12), hairMat);
    bHairBack.position.set(0, 0.02, 0.13);
    const bHairBun = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.18, 0.14), hairMat);
    bHairBun.position.set(0, 0.04, 0.22);
    // Cute Roblox side hair locks framing her face
    const bLockL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.30, 0.10), hairMat);
    bLockL.position.set(-0.16, -0.01, -0.10);
    const bLockR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.30, 0.10), hairMat);
    bLockR.position.set(0.16, -0.01, -0.10);

    // Sparkling 3D Golden Tiara Crown on top of Bride's Roblox Head
    const tiaraGroup = new THREE.Group();
    tiaraGroup.position.set(0, 0.22, -0.06);
    const tiaraBase = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.045, 0.16), goldMat);
    const tiaraPeak = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.04), goldMat);
    tiaraPeak.position.set(0, 0.04, -0.06);
    const tiaraGem = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, 0.02),
      new THREE.MeshBasicMaterial({ color: '#ff8da1' })
    );
    tiaraGem.position.set(0, 0.04, -0.08);
    tiaraGroup.add(tiaraBase, tiaraPeak, tiaraGem);

    brideHairGroup.add(bHairTop, bHairBack, bHairBun, bLockL, bLockR, tiaraGroup);
    this.brideHeadGroup.add(brideHeadMesh, brideHairGroup);

    // Flowing Translucent Roblox Wedding Veil
    this.brideVeil = new THREE.Group();
    this.brideVeil.position.set(0, 1.24, 0.18);
    const veilTop = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.45, 0.04), veilMat);
    veilTop.position.set(0, -0.20, 0.04);
    const veilBottom = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.55, 0.04), veilMat);
    veilBottom.position.set(0, -0.52, 0.10);
    this.brideVeil.add(veilTop, veilBottom);
    this.brideVeil.rotation.x = 0.22;

    this.bride.add(
      this.brideLeftLeg,
      this.brideRightLeg,
      this.brideSkirt,
      brideTorso,
      this.brideLeftArm,
      this.brideRightArm,
      this.brideHeadGroup,
      this.brideVeil
    );

    const coupleLight = new THREE.PointLight('#fff0cf', 3.4, 11);
    coupleLight.position.set(0, 2.3, 1.8);

    // Slightly scale up the Roblox couple so their details shine clearly on mobile & desktop
    this.coupleGroup.scale.setScalar(1.12);
    this.coupleGroup.add(this.groom, this.bride, coupleLight);
    this.scene.add(this.coupleGroup);
  }

  buildEntranceGate() {
    this.gateGroup = new THREE.Group();
    this.gateGroup.position.set(0, 0.02, 2.4);

    const pillarMat = new THREE.MeshStandardMaterial({
      color: '#f5f2eb',
      roughness: 0.5,
      metalness: 0.08
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#f3c677',
      roughness: 0.25,
      metalness: 0.85,
      emissive: '#4d3612',
      emissiveIntensity: 0.35
    });

    const pillarGeo = new THREE.BoxGeometry(0.62, 3.8, 0.62);
    const leftPillar = new THREE.Mesh(pillarGeo, pillarMat);
    leftPillar.position.set(-2.2, 1.9, 0);
    const rightPillar = new THREE.Mesh(pillarGeo, pillarMat);
    rightPillar.position.set(2.2, 1.9, 0);
    this.gateGroup.add(leftPillar, rightPillar);

    const archGeo = new THREE.TorusGeometry(2.2, 0.14, 14, 44, Math.PI);
    const archMesh = new THREE.Mesh(archGeo, goldMat);
    archMesh.position.set(0, 3.75, 0);
    this.gateGroup.add(archMesh);

    const blossomGeo = new THREE.DodecahedronGeometry(0.28, 1);
    const blossomMat = new THREE.MeshStandardMaterial({
      color: '#ffb7c5',
      emissive: '#6e2536',
      emissiveIntensity: 0.35,
      roughness: 0.5
    });
    for (let i = 0; i <= 12; i++) {
      const angle = (i / 12) * Math.PI;
      const b = new THREE.Mesh(blossomGeo, blossomMat);
      b.position.set(Math.cos(angle) * 2.2, 3.75 + Math.sin(angle) * 2.2, 0.14);
      b.scale.setScalar(0.8 + (i % 3) * 0.22);
      this.gateGroup.add(b);
    }

    this.gateLeftPivot = new THREE.Group();
    this.gateLeftPivot.position.set(-1.88, 0, 0);
    this.gateRightPivot = new THREE.Group();
    this.gateRightPivot.position.set(1.88, 0, 0);

    const buildDoorWing = (dir) => {
      const wing = new THREE.Group();
      for (let b = 1; b <= 5; b++) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.0 + b * 0.08, 8), goldMat);
        bar.position.set(dir * (b * 0.31), 1.6, 0);
        wing.add(bar);
      }
      return wing;
    };

    this.gateLeftPivot.add(buildDoorWing(1));
    this.gateRightPivot.add(buildDoorWing(-1));
    this.gateGroup.add(this.gateLeftPivot, this.gateRightPivot);
    this.scene.add(this.gateGroup);
  }

  // ==========================================================================
  // REALISTIC MULTI-BRANCH TREES, FISSURED BARK & LAYERED BOTANICAL CANOPIES
  // ==========================================================================
  createTreeBarkTextures() {
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 512;
    colorCanvas.height = 512;
    const ctx = colorCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d');

    // Rich aged oak / cherry-blossom bark base
    ctx.fillStyle = '#3f2d22';
    ctx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = '#707070';
    bCtx.fillRect(0, 0, 512, 512);

    // Deep vertical bark fissures & organic woody ridges
    for (let i = 0; i < 160; i++) {
      const xStart = (i * 37) % 512;
      const isDarkGroove = i % 2 === 0;
      ctx.strokeStyle = isDarkGroove ? 'rgba(24, 15, 10, 0.72)' : 'rgba(92, 68, 52, 0.55)';
      ctx.lineWidth = isDarkGroove ? 2.5 + (i % 3) * 1.5 : 3.2 + (i % 4) * 1.4;

      bCtx.strokeStyle = isDarkGroove ? '#1c1c1c' : '#dadada';
      bCtx.lineWidth = ctx.lineWidth;

      ctx.beginPath();
      bCtx.beginPath();
      let x = xStart;
      let y = 0;
      ctx.moveTo(x, y);
      bCtx.moveTo(x, y);

      while (y < 512) {
        y += 24;
        x += Math.sin(y * 0.05 + i * 0.7) * 5.5;
        ctx.lineTo(x, y);
        bCtx.lineTo(x, y);
      }
      ctx.stroke();
      bCtx.stroke();
    }

    // Subtle green woodland moss patches near lower trunk
    for (let m = 0; m < 28; m++) {
      const mx = (m * 67) % 512;
      const my = 320 + ((m * 43) % 185);
      const mr = 14 + (m % 4) * 8;
      const grad = ctx.createRadialGradient(mx, my, 2, mx, my, mr);
      grad.addColorStop(0, 'rgba(65, 105, 62, 0.48)');
      grad.addColorStop(1, 'rgba(65, 105, 62, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0, Math.PI * 2);
      ctx.fill();
    }

    const colorTex = new THREE.CanvasTexture(colorCanvas);
    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.wrapS = THREE.RepeatWrapping;
    colorTex.wrapT = THREE.RepeatWrapping;
    colorTex.repeat.set(2, 3);

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(2, 3);

    return { colorTex, bumpTex };
  }

  createFoliageCanopyTextures() {
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = 512;
    colorCanvas.height = 512;
    const ctx = colorCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = 512;
    bumpCanvas.height = 512;
    const bCtx = bumpCanvas.getContext('2d');

    // Neutral mid-light base so material color tint controls species palette
    ctx.fillStyle = '#b8b8b8';
    ctx.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = '#555555';
    bCtx.fillRect(0, 0, 512, 512);

    // Thousands of overlapping botanical leaves & dappled canopy shadow pockets
    const tones = ['#727272', '#949494', '#bcbcbc', '#dfdfdf', '#ffffff'];
    for (let i = 0; i < 2600; i++) {
      const lx = (i * 89 + (i % 11) * 23) % 512;
      const ly = (i * 61 + (i % 7) * 37) % 512;
      const rx = 5 + (i % 4) * 2.2;
      const ry = 2.8 + (i % 3) * 1.4;
      const rot = ((i * 19) % 100) * 0.0628;

      ctx.fillStyle = tones[i % tones.length];
      ctx.beginPath();
      ctx.ellipse(lx, ly, rx, ry, rot, 0, Math.PI * 2);
      ctx.fill();

      bCtx.fillStyle = i % 2 === 0 ? '#d8d8d8' : '#303030';
      bCtx.beginPath();
      bCtx.ellipse(lx, ly, rx * 0.9, ry * 0.9, rot, 0, Math.PI * 2);
      bCtx.fill();
    }

    const colorTex = new THREE.CanvasTexture(colorCanvas);
    colorTex.colorSpace = THREE.SRGBColorSpace;
    colorTex.wrapS = THREE.RepeatWrapping;
    colorTex.wrapT = THREE.RepeatWrapping;
    colorTex.repeat.set(3, 3);

    const bumpTex = new THREE.CanvasTexture(bumpCanvas);
    bumpTex.wrapS = THREE.RepeatWrapping;
    bumpTex.wrapT = THREE.RepeatWrapping;
    bumpTex.repeat.set(3, 3);

    return { colorTex, bumpTex };
  }

  createSculptedBoughGeometry() {
    // Organic botanical foliage pad with natural leafy silhouette bumps (not a smooth ball!)
    const geo = new THREE.IcosahedronGeometry(1.0, 2);
    const pos = geo.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);

      // Multi-frequency organic leaf-clump displacement
      const clumpNoise =
        Math.sin(vx * 4.2 + vy * 3.5) * 0.13 +
        Math.cos(vz * 4.6 - vx * 3.2) * 0.11 +
        Math.sin((vx + vy + vz) * 6.5) * 0.06;

      // Flatten slightly on Y and flatten underside like real tree canopy boughs
      const ySquash = vy < 0 ? 0.58 : 0.76;
      const r = 1.0 + clumpNoise;

      pos.setXYZ(i, vx * r * 1.16, vy * r * ySquash, vz * r * 1.12);
    }

    geo.computeVertexNormals();
    return geo;
  }

  createRealisticGardenTree(speciesIndex, scale, barkMat, boughGeo, speciesPalettes, seed = 0) {
    const treeGroup = new THREE.Group();

    // 1. Flared Root Base + 4 Spreading Surface Roots gripping the garden soil
    const rootCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17 * scale, 0.34 * scale, 0.55 * scale, 10),
      barkMat
    );
    rootCollar.position.y = 0.25 * scale;
    treeGroup.add(rootCollar);

    const rootGeo = new THREE.CylinderGeometry(0.045 * scale, 0.11 * scale, 0.72 * scale, 7);
    for (let r = 0; r < 4; r++) {
      const rAngle = (r / 4) * Math.PI * 2 + (seed % 5) * 0.25;
      const rootMesh = new THREE.Mesh(rootGeo, barkMat);
      rootMesh.position.set(
        Math.cos(rAngle) * 0.22 * scale,
        0.14 * scale,
        Math.sin(rAngle) * 0.22 * scale
      );
      rootMesh.rotation.order = 'YXZ';
      rootMesh.rotation.y = -rAngle + Math.PI * 0.5;
      rootMesh.rotation.x = 0.92;
      treeGroup.add(rootMesh);
    }

    // 2. Organic Two-Stage Tapered Main Trunk with Natural Lean
    const leanX = ((seed % 5) - 2) * 0.032;
    const leanZ = (((seed * 3) % 5) - 2) * 0.032;

    const lowerTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145 * scale, 0.20 * scale, 1.45 * scale, 10),
      barkMat
    );
    lowerTrunk.position.set(0, 0.92 * scale, 0);
    lowerTrunk.rotation.set(leanZ, 0, -leanX);
    treeGroup.add(lowerTrunk);

    const upperTopX = leanX * 1.4 * scale;
    const upperTopZ = leanZ * 1.4 * scale;
    const upperTrunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105 * scale, 0.148 * scale, 1.25 * scale, 9),
      barkMat
    );
    upperTrunk.position.set(upperTopX, 2.12 * scale, upperTopZ);
    upperTrunk.rotation.set(leanZ * 1.5, 0, -leanX * 1.5);
    treeGroup.add(upperTrunk);

    // 3. Crown Group (Forking Wooden Branches + Layered Sculpted Foliage Boughs)
    const crownGroup = new THREE.Group();
    crownGroup.position.set(upperTopX, 2.55 * scale, upperTopZ);

    const palette = speciesPalettes[speciesIndex % speciesPalettes.length];

    // Center apical branch + top sunlit canopy dome
    const centerBranch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04 * scale, 0.085 * scale, 1.05 * scale, 7),
      barkMat
    );
    centerBranch.position.y = 0.45 * scale;
    crownGroup.add(centerBranch);

    // 5 Spreading Primary Wooden Limbs with Multi-Tiered Leafy Boughs
    const branchCount = 5;
    for (let b = 0; b < branchCount; b++) {
      const azim = (b / branchCount) * Math.PI * 2 + (seed % 7) * 0.35;
      const tilt = 0.58 + (b % 3) * 0.12; // ~33° to 47° outward spread
      const bLen = (1.18 + (b % 2) * 0.24) * scale;

      const limb = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038 * scale, 0.088 * scale, bLen, 7),
        barkMat
      );

      const midDist = Math.sin(tilt) * bLen * 0.48;
      const midY = Math.cos(tilt) * bLen * 0.48 - 0.15 * scale;
      limb.position.set(Math.cos(azim) * midDist, midY, Math.sin(azim) * midDist);
      limb.rotation.order = 'YXZ';
      limb.rotation.y = -azim + Math.PI * 0.5;
      limb.rotation.x = tilt;
      crownGroup.add(limb);

      const tipX = Math.cos(azim) * Math.sin(tilt) * bLen;
      const tipY = Math.cos(tilt) * bLen - 0.12 * scale;
      const tipZ = Math.sin(azim) * Math.sin(tilt) * bLen;

      // Secondary sub-branch fork
      const twig = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022 * scale, 0.042 * scale, 0.55 * scale, 6),
        barkMat
      );
      twig.position.set(tipX * 0.72, tipY * 0.72 + 0.18 * scale, tipZ * 0.72);
      twig.rotation.set(tilt * 0.6, azim + 0.6, 0.35);
      crownGroup.add(twig);

      // Lower Shadowed Under-Bough Pad
      const underPad = new THREE.Mesh(boughGeo, palette.shadowMat);
      underPad.position.set(tipX * 0.92, tipY - 0.08 * scale, tipZ * 0.92);
      underPad.scale.set(0.76 * scale, 0.58 * scale, 0.74 * scale);
      underPad.rotation.y = azim;
      crownGroup.add(underPad);

      // Mid Lush Main Bough Pad
      const mainPad = new THREE.Mesh(boughGeo, palette.midMat);
      mainPad.position.set(tipX * 1.05, tipY + 0.22 * scale, tipZ * 1.05);
      mainPad.scale.set(0.86 * scale, 0.68 * scale, 0.82 * scale);
      mainPad.rotation.set(0.08, azim + 0.4, -0.06);
      crownGroup.add(mainPad);

      // Upper Sunlit Highlight Bough Pad
      const sunPad = new THREE.Mesh(boughGeo, palette.highlightMat);
      sunPad.position.set(tipX * 0.68, tipY + 0.54 * scale, tipZ * 0.68);
      sunPad.scale.set(0.68 * scale, 0.56 * scale, 0.66 * scale);
      sunPad.rotation.y = -azim;
      crownGroup.add(sunPad);
    }

    // Grand Central Apex Canopy Crown
    const apexMid = new THREE.Mesh(boughGeo, palette.midMat);
    apexMid.position.set(0, 0.92 * scale, 0);
    apexMid.scale.set(1.08 * scale, 0.82 * scale, 1.04 * scale);
    crownGroup.add(apexMid);

    const apexHighlight = new THREE.Mesh(boughGeo, palette.highlightMat);
    apexHighlight.position.set(0.08 * scale, 1.28 * scale, -0.06 * scale);
    apexHighlight.scale.set(0.82 * scale, 0.64 * scale, 0.78 * scale);
    crownGroup.add(apexHighlight);

    treeGroup.add(crownGroup);
    return { treeGroup, crownGroup };
  }

  buildTreesAndFlowers() {
    const { colorTex: barkTex, bumpTex: barkBump } = this.createTreeBarkTextures();
    const barkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      bumpMap: barkBump,
      bumpScale: 0.14,
      roughness: 0.88,
      metalness: 0.03
    });

    const { colorTex: leafTex, bumpTex: leafBump } = this.createFoliageCanopyTextures();
    const makeCanopyMat = (color, emissive = '#000000', emissiveIntensity = 0.0, roughness = 0.72) =>
      new THREE.MeshStandardMaterial({
        color,
        map: leafTex,
        bumpMap: leafBump,
        bumpScale: 0.09,
        emissive,
        emissiveIntensity,
        roughness,
        metalness: 0.02
      });

    // 4 Realistic Botanical Garden Tree Species Palettes (3-tier shadow/mid/sunlit shading)
    const speciesPalettes = [
      // 0: Lush Botanical Oak (Deep Forest -> Rich Emerald -> Sunlit Olive Leaf)
      {
        shadowMat: makeCanopyMat('#234c35', '#0b1c12', 0.12, 0.76),
        midMat: makeCanopyMat('#356e4b', '#12291a', 0.15, 0.72),
        highlightMat: makeCanopyMat('#589665', '#1f3d23', 0.18, 0.68)
      },
      // 1: White & Blush Royal Sakura / Cherry Blossom Tree
      {
        shadowMat: makeCanopyMat('#d98fa3', '#4d1a28', 0.22, 0.64),
        midMat: makeCanopyMat('#f7becd', '#612636', 0.25, 0.58),
        highlightMat: makeCanopyMat('#fff0f5', '#733847', 0.28, 0.52)
      },
      // 2: Sunlit Cypress / Meadow Elm (Rich Sage -> Vibrant Moss -> Golden-Lime Tip)
      {
        shadowMat: makeCanopyMat('#2b5942', '#0d2117', 0.12, 0.75),
        midMat: makeCanopyMat('#46825e', '#173322', 0.16, 0.70),
        highlightMat: makeCanopyMat('#72ad75', '#2b4726', 0.20, 0.65)
      },
      // 3: Golden-Hour Champagne Ginkgo / Autumnal Garden Tree
      {
        shadowMat: makeCanopyMat('#b88946', '#3d280b', 0.20, 0.68),
        midMat: makeCanopyMat('#e5b96e', '#4d3610', 0.24, 0.62),
        highlightMat: makeCanopyMat('#ffdf9e', '#5e4416', 0.28, 0.56)
      }
    ];

    const boughGeo = this.createSculptedBoughGeometry();

    const pt = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const sideNormal = new THREE.Vector3();

    // 1. Primary Hero Garden Trees flanking the Walkway & Rolling Hills (scaled for device spec)
    const treeCount = this.isLowSpec ? 36 : 72;
    for (let i = 0; i < treeCount; i++) {
      const t = 0.03 + (i / treeCount) * 0.78;
      this.cameraCurve.getPointAt(t, pt);
      this.cameraCurve.getTangentAt(t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const side = i % 2 === 0 ? 1 : -1;
      // Staggered avenue row (4.4m..8.5m) + outer woodland hillside row (8.8m..15.5m)
      const isOuterWoodland = i % 3 === 2;
      let dist = isOuterWoodland
        ? 9.2 + ((i * 19) % 8) * 0.85
        : 4.5 + ((i * 17) % 7) * 0.62;

      let tx = pt.x + sideNormal.x * side * dist;
      let tz = pt.z + sideNormal.z * side * dist;
      if (tz < -114.0 && Math.abs(tx) < 9.5) {
        dist += 5.5;
        tx = pt.x + sideNormal.x * side * dist;
        tz = pt.z + sideNormal.z * side * dist;
      }
      const { y: ty } = this.getTerrainHeightAt(tx, tz);

      const scale = (isOuterWoodland ? 1.05 : 0.88) + ((i * 7) % 5) * 0.14;
      const speciesIdx = (i * 3 + (i % 2)) % speciesPalettes.length;

      const { treeGroup, crownGroup } = this.createRealisticGardenTree(
        speciesIdx,
        scale,
        barkMat,
        boughGeo,
        speciesPalettes,
        i
      );

      // Sink 6cm into terrain so flared roots grip the slope naturally
      treeGroup.position.set(tx, ty - 0.06, tz);
      treeGroup.rotation.y = (i * 1.9) % (Math.PI * 2);

      this.scene.add(treeGroup);
      this.treeCrowns.push({ group: crownGroup, phase: i * 0.85 });
    }

    // 2. Natural Sandstone & Granite Border Stones along the Path (Stopped before Gazebo)
    const borderStoneMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      bumpMap: leafBump,
      bumpScale: 0.06,
      roughness: 0.85,
      metalness: 0.04
    });
    const stoneColors = [
      new THREE.Color('#b5aba0'), // Warm Limestone
      new THREE.Color('#9c948a'), // Natural River Stone Grey
      new THREE.Color('#cabfa3'), // Warm Sandstone Beige
      new THREE.Color('#857e75')  // Slate Cobble
    ];
    const shrubCount = this.isLowSpec ? 60 : 120;
    const shrubInst = new THREE.InstancedMesh(boughGeo, borderStoneMat, shrubCount);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < shrubCount; i++) {
      const t = 0.02 + (i / shrubCount) * 0.78;
      this.cameraCurve.getPointAt(t, pt);
      this.cameraCurve.getTangentAt(t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const side = i % 2 === 0 ? 1 : -1;
      const offset = 1.62 + ((i * 11) % 6) * 0.28;
      const sx = pt.x + sideNormal.x * side * offset;
      const sz = pt.z + sideNormal.z * side * offset;
      const { y: sy } = this.getTerrainHeightAt(sx, sz);

      if (sz < -115.5 || Math.hypot(sx, sz + 124.2) < 8.5) {
        dummy.scale.setScalar(0);
      } else {
        const rad = 0.24 + (i % 4) * 0.08;
        dummy.position.set(sx, sy + rad * 0.28, sz);
        dummy.rotation.set(0, (i * 1.3) % (Math.PI * 2), 0);
        dummy.scale.set(rad * 1.15, rad * 0.65, rad * 1.1);
      }
      dummy.updateMatrix();
      shrubInst.setMatrixAt(i, dummy.matrix);
      shrubInst.setColorAt(i, stoneColors[i % stoneColors.length]);
    }
    shrubInst.instanceColor.needsUpdate = true;
    this.scene.add(shrubInst);

    // 3. Multi-Color Blooming Garden Flowers along the Path (Stopped before Gazebo)
    const flowerCount = this.isLowSpec ? 120 : 260;
    const flowerGeo = new THREE.DodecahedronGeometry(0.11, 1);
    const flowerMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ffd285',
      emissiveIntensity: 0.38,
      roughness: 0.38
    });
    const flowerInst = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);
    const blossomPalette = [
      new THREE.Color('#fff5dc'), // Warm Ivory Rose
      new THREE.Color('#ffb7c5'), // Blush Pink Peony
      new THREE.Color('#ffd97d'), // Golden Marigold
      new THREE.Color('#f48fb1'), // Romantic Rose
      new THREE.Color('#ffffff')  // Pure White Lily
    ];

    for (let i = 0; i < flowerCount; i++) {
      const t = 0.015 + (i / flowerCount) * 0.78;
      this.cameraCurve.getPointAt(t, pt);
      this.cameraCurve.getTangentAt(t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const side = i % 2 === 0 ? 1 : -1;
      const offset = 1.38 + ((i * 13) % 9) * 0.22;
      const fx = pt.x + sideNormal.x * side * offset;
      const fz = pt.z + sideNormal.z * side * offset;
      const { y: fy } = this.getTerrainHeightAt(fx, fz);

      if (fz < -115.5 || Math.hypot(fx, fz + 124.2) < 8.5) {
        dummy.scale.setScalar(0);
      } else {
        dummy.position.set(fx, fy + 0.08 + (i % 3) * 0.06, fz);
        dummy.rotation.set((i * 0.5) % 0.6, (i * 1.7) % (Math.PI * 2), 0);
        const s = 0.62 + (i % 4) * 0.22;
        dummy.scale.set(s, s * 0.78, s);
      }
      dummy.updateMatrix();
      flowerInst.setMatrixAt(i, dummy.matrix);
      flowerInst.setColorAt(i, blossomPalette[i % blossomPalette.length]);
    }
    flowerInst.instanceColor.needsUpdate = true;
    this.scene.add(flowerInst);
  }

  buildLanternsAndFrames() {
    const pt = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const sideNormal = new THREE.Vector3();

    const frameStops = [
      { t: 0.22, side: 1, title: 'Faris & Vita', subtitle: 'Sky Garden', theme: 0 },
      { t: 0.37, side: -1, title: 'The Proposal', subtitle: 'September 2026', theme: 1 },
      { t: 0.56, side: 1, title: 'Bangsal Pancasila', subtitle: 'UWKS Surabaya', theme: 0 },
      { t: 0.62, side: -1, title: 'Golden Dusk', subtitle: 'Faris & Vita', theme: 2 },
      { t: 0.68, side: 1, title: 'Sacred Vows', subtitle: '10.01.2027', theme: 1 }
    ];

    const goldBorderMat = new THREE.MeshStandardMaterial({
      color: '#f3c677',
      metalness: 0.8,
      roughness: 0.25
    });

    frameStops.forEach((cfg, idx) => {
      this.cameraCurve.getPointAt(cfg.t, pt);
      this.cameraCurve.getTangentAt(cfg.t, tangent);
      sideNormal.crossVectors(tangent, up).normalize();

      const group = new THREE.Group();
      const fx = pt.x + sideNormal.x * cfg.side * 2.25;
      const fz = pt.z + sideNormal.z * cfg.side * 2.25;
      const fy = pt.y - 0.2;

      group.position.set(fx, fy, fz);
      group.lookAt(pt.x - tangent.x * 5.0, fy, pt.z - tangent.z * 5.0);

      const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(1.65, 2.05, 0.08), goldBorderMat);
      const tex = this.createRomanticPortraitTexture(cfg.title, cfg.subtitle, cfg.theme);
      const artMat = new THREE.MeshBasicMaterial({ map: tex });
      const artPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 1.88), artMat);
      artPlane.position.z = 0.046;

      group.add(outerFrame, artPlane);
      this.scene.add(group);
      this.floatingFrames.push({ group, baseY: fy, phase: idx * 1.3 });
    });
  }

  createRomanticPortraitTexture(title, subtitle, themeIndex = 0) {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 640;
    this.drawRomanticArtwork(c, title, subtitle, themeIndex);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  drawRomanticArtwork(canvas, title, subtitle, themeIndex = 0) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    const palettes = [
      ['#1a3999', '#6e8be8', '#ffdfc2'],
      ['#2c2b6e', '#8c72c4', '#f7b9c4'],
      ['#17455c', '#5796a8', '#ffe3a8']
    ];
    const pal = palettes[themeIndex % palettes.length];

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, pal[0]);
    grad.addColorStop(0.58, pal[1]);
    grad.addColorStop(1, pal[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(255, 248, 232, 0.88)';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.35, w * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    ctx.fillStyle = '#182447';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.85, w * 0.65, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(w * 0.45, h * 0.51, 17, 0, Math.PI * 2);
    ctx.arc(w * 0.55, h * 0.53, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(w * 0.41, h * 0.54, 34, 95);
    ctx.beginPath();
    ctx.moveTo(w * 0.55, h * 0.56);
    ctx.lineTo(w * 0.47, h * 0.72);
    ctx.lineTo(w * 0.64, h * 0.72);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 600 34px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, w * 0.5, h * 0.84);

    ctx.fillStyle = '#ffe2a8';
    ctx.font = '500 17px monospace';
    ctx.fillText(subtitle.toUpperCase(), w * 0.5, h * 0.90);
  }

  // ==========================================================================
  // PROCEDURAL CARRARA MARBLE, FLUTED COLUMN, & PELAMINAN ARCH TEXTURES
  // ==========================================================================
  createCarraraMarbleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fbf9f5';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle Carrara grey & warm gold marble veining
    for (let v = 0; v < 26; v++) {
      ctx.strokeStyle = v % 4 === 0 ? 'rgba(215, 180, 115, 0.16)' : 'rgba(145, 150, 160, 0.14)';
      ctx.lineWidth = 1.5 + (v % 3) * 1.8;
      ctx.beginPath();
      let x = (v * 47) % 512;
      let y = 0;
      ctx.moveTo(x, y);
      while (y < 512) {
        y += 32;
        x += Math.sin(y * 0.04 + v) * 24;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  createFlutedColumnTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const fluteCount = 20;
    const fluteW = 512 / fluteCount;
    for (let i = 0; i < fluteCount; i++) {
      const x0 = i * fluteW;
      const grad = ctx.createLinearGradient(x0, 0, x0 + fluteW, 0);
      grad.addColorStop(0.0, '#d8d2c7');
      grad.addColorStop(0.25, '#fbf9f4');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(0.75, '#f2ede4');
      grad.addColorStop(1.0, '#cfc8bc');
      ctx.fillStyle = grad;
      ctx.fillRect(x0, 0, fluteW, 512);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createArchPanelMesh(width, height, depth, material) {
    // True Classical Rounded-Top Arch Panel (Rectangle + Semicircle Top)
    const radius = width * 0.5;
    const rectH = Math.max(0.2, height - radius);
    const shape = new THREE.Shape();
    shape.moveTo(-radius, 0);
    shape.lineTo(radius, 0);
    shape.lineTo(radius, rectH);
    shape.absarc(0, rectH, radius, 0, Math.PI, false);
    shape.lineTo(-radius, 0);

    const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.025,
      bevelThickness: 0.025
    });
    extrudeGeo.translate(0, 0, -depth * 0.5);
    return new THREE.Mesh(extrudeGeo, material);
  }

  createLushFloralCluster(widthSpan, density = 28) {
    // Multi-scale realistic floral arrangement: Eucalyptus foliage + Hydrangeas + Roses + Fairy lights
    const cluster = new THREE.Group();

    const leafMat = new THREE.MeshStandardMaterial({ color: '#2b593f', roughness: 0.65 });
    const sageMat = new THREE.MeshStandardMaterial({ color: '#5c8a6e', roughness: 0.7 });
    const rosePalette = [
      new THREE.MeshStandardMaterial({ color: '#fffcf7', roughness: 0.4, emissive: '#382c1e', emissiveIntensity: 0.15 }),
      new THREE.MeshStandardMaterial({ color: '#ffd6e0', roughness: 0.42, emissive: '#4a1c28', emissiveIntensity: 0.18 }),
      new THREE.MeshStandardMaterial({ color: '#f7a8b8', roughness: 0.45, emissive: '#4d1522', emissiveIntensity: 0.18 }),
      new THREE.MeshStandardMaterial({ color: '#ffe5b4', roughness: 0.4, emissive: '#4a3210', emissiveIntensity: 0.2 }),
      new THREE.MeshStandardMaterial({ color: '#f2c6c2', roughness: 0.45, emissive: '#3d1c1a', emissiveIntensity: 0.15 })
    ];
    const fairyMat = new THREE.MeshBasicMaterial({ color: '#fff6d6' });

    const leafGeo = new THREE.ConeGeometry(0.08, 0.28, 5);
    const hydrangeaGeo = new THREE.DodecahedronGeometry(0.15, 1);
    const roseOuterGeo = new THREE.DodecahedronGeometry(0.10, 1);
    const roseBudGeo = new THREE.SphereGeometry(0.055, 8, 8);
    const fairyGeo = new THREE.SphereGeometry(0.022, 6, 6);

    for (let i = 0; i < density; i++) {
      const frac = i / Math.max(1, density - 1) - 0.5;
      const bx = frac * widthSpan + (Math.sin(i * 3.7) * 0.08);
      const by = Math.cos(frac * Math.PI) * 0.16 + (Math.cos(i * 2.3) * 0.07);
      const bz = Math.sin(i * 1.9) * 0.10;

      // 1. Greenery & Eucalyptus leaves radiating outward
      for (let l = 0; l < 2; l++) {
        const leaf = new THREE.Mesh(leafGeo, (i + l) % 2 === 0 ? leafMat : sageMat);
        leaf.position.set(bx, by, bz - 0.03);
        leaf.rotation.set(
          (Math.sin(i + l) - 0.5) * 1.2,
          l * 1.5,
          -frac * 1.6 + (l === 0 ? 0.65 : -0.65)
        );
        cluster.add(leaf);
      }

      // 2. Hydrangea puff base
      const hydMat = rosePalette[i % rosePalette.length];
      const hyd = new THREE.Mesh(hydrangeaGeo, hydMat);
      hyd.position.set(bx, by, bz);
      hyd.scale.setScalar(0.75 + (i % 3) * 0.22);
      cluster.add(hyd);

      // 3. Detailed layered Rose bloom in front
      const roseMat = rosePalette[(i + 2) % rosePalette.length];
      const rose = new THREE.Mesh(roseOuterGeo, roseMat);
      rose.position.set(bx + 0.03, by + 0.02, bz + 0.08);
      const bud = new THREE.Mesh(roseBudGeo, rosePalette[(i + 1) % rosePalette.length]);
      bud.position.set(bx + 0.03, by + 0.02, bz + 0.14);
      cluster.add(rose, bud);

      // 4. Twinkling warm fairy light bulb
      if (i % 3 === 0) {
        const bulb = new THREE.Mesh(fairyGeo, fairyMat);
        bulb.position.set(bx, by + 0.06, bz + 0.16);
        cluster.add(bulb);
      }
    }

    return cluster;
  }

  // ==========================================================================
  // ULTRA-REALISTIC CLASSICAL GAZEBO & LUXURY WEDDING PELAMINAN BACKDROP
  // ==========================================================================
  buildSanctuaryGazebo() {
    const gazeboCenter = new THREE.Vector3();
    this.cameraCurve.getPointAt(0.905, gazeboCenter);

    this.gazeboGroup = new THREE.Group();
    this.gazeboGroup.position.set(gazeboCenter.x, gazeboCenter.y - 1.8, gazeboCenter.z);

    const marbleTex = this.createCarraraMarbleTexture();
    const flutedTex = this.createFlutedColumnTexture();

    const marbleMat = new THREE.MeshStandardMaterial({
      map: marbleTex,
      roughness: 0.28,
      metalness: 0.08
    });
    const flutedColMat = new THREE.MeshStandardMaterial({
      map: flutedTex,
      roughness: 0.35,
      metalness: 0.06
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#f3c677',
      roughness: 0.22,
      metalness: 0.88,
      emissive: '#4d3612',
      emissiveIntensity: 0.32
    });
    const drapeMat = new THREE.MeshPhysicalMaterial({
      color: '#fffcf5',
      transparent: true,
      opacity: 0.78,
      roughness: 0.35,
      clearcoat: 0.2,
      side: THREE.DoubleSide
    });
    const champagneVelvetMat = new THREE.MeshStandardMaterial({
      color: '#f5ebd9',
      roughness: 0.52,
      metalness: 0.08
    });
    const ivorySilkMat = new THREE.MeshStandardMaterial({
      color: '#fffaf0',
      roughness: 0.42,
      metalness: 0.05
    });
    const walnutMat = new THREE.MeshStandardMaterial({
      color: '#26160e',
      roughness: 0.55,
      metalness: 0.1
    });

    // ------------------------------------------------------------------------
    // 1. MULTI-TIERED CARRARA MARBLE PLATFORM + GOLD INLAY + AISLE CARPET
    // ------------------------------------------------------------------------
    const step1 = new THREE.Mesh(new THREE.CylinderGeometry(6.1, 6.3, 0.06, 48), marbleMat);
    step1.position.y = 0.01;
    const step2 = new THREE.Mesh(new THREE.CylinderGeometry(5.6, 5.75, 0.06, 48), marbleMat);
    step2.position.y = 0.04;

    const goldRingOuter = new THREE.Mesh(new THREE.RingGeometry(5.45, 5.58, 48), goldMat);
    goldRingOuter.rotation.x = -Math.PI / 2;
    goldRingOuter.position.y = 0.075;

    const goldRingInner = new THREE.Mesh(new THREE.RingGeometry(4.65, 4.78, 48), goldMat);
    goldRingInner.rotation.x = -Math.PI / 2;
    goldRingInner.position.y = 0.075;

    // Plush Ivory & Gold Bordered Wedding Aisle Runner Carpet
    const carpetRunner = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.02, 7.2), ivorySilkMat);
    carpetRunner.position.set(0, 0.072, 1.2);
    const carpetGoldEdgeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.024, 7.2), goldMat);
    carpetGoldEdgeL.position.set(-1.02, 0.073, 1.2);
    const carpetGoldEdgeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.024, 7.2), goldMat);
    carpetGoldEdgeR.position.set(1.02, 0.073, 1.2);

    this.gazeboGroup.add(step1, step2, goldRingOuter, goldRingInner, carpetRunner, carpetGoldEdgeL, carpetGoldEdgeR);

    // ------------------------------------------------------------------------
    // 2. 8 CLASSICAL FLUTED CORINTHIAN COLUMNS + CHIFFON DRAPERY & FAIRY LIGHTS
    // ------------------------------------------------------------------------
    const colRadius = 5.15;
    const colHeight = 4.85;

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const cx = Math.cos(angle) * colRadius;
      const cz = Math.sin(angle) * colRadius;

      const colGroup = new THREE.Group();
      colGroup.position.set(cx, 0.06, cz);
      colGroup.lookAt(0, 0.06, 0);

      // Molded Square Plinth & Torus Base
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.62), marbleMat);
      plinth.position.y = 0.11;
      const baseTorus = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 12, 24), goldMat);
      baseTorus.rotation.x = Math.PI / 2;
      baseTorus.position.y = 0.25;
      const baseMolding = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.16, 20), marbleMat);
      baseMolding.position.y = 0.30;

      // Fluted Classical Column Shaft
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, colHeight - 0.7, 24), flutedColMat);
      shaft.position.y = (colHeight - 0.7) * 0.5 + 0.35;

      // Ornate Corinthian / Ionic Capital with Gold Astragal & Abacus
      const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.035, 10, 24), goldMat);
      neckRing.rotation.x = Math.PI / 2;
      neckRing.position.y = colHeight - 0.38;

      const capitalBell = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.19, 0.28, 20), goldMat);
      capitalBell.position.y = colHeight - 0.22;

      const abacus = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.12, 0.66), marbleMat);
      abacus.position.y = colHeight - 0.04;

      // Romantic Chiffon Curtain Drapery Swag wrapped around the Column
      const upperDrape = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.16, 1.9, 16, 1, true), drapeMat);
      upperDrape.position.set(0, 3.45, 0.03);
      upperDrape.rotation.z = 0.08;

      const lowerDrape = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, 2.1, 16, 1, true), drapeMat);
      lowerDrape.position.set(0, 1.45, 0.03);
      lowerDrape.rotation.z = -0.06;

      // Golden Tie-Back Sash + Mini Rose Corsage on Each Column
      const tieSash = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.03, 10, 20), goldMat);
      tieSash.rotation.x = Math.PI / 2;
      tieSash.position.set(0, 2.48, 0.03);

      const tieFlower = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.09, 1),
        new THREE.MeshBasicMaterial({ color: '#ffb7c5' })
      );
      tieFlower.position.set(0, 2.48, 0.22);

      colGroup.add(
        plinth,
        baseTorus,
        baseMolding,
        shaft,
        neckRing,
        capitalBell,
        abacus,
        upperDrape,
        lowerDrape,
        tieSash,
        tieFlower
      );
      this.gazeboGroup.add(colGroup);
    }

    // ------------------------------------------------------------------------
    // 3. CLASSICAL ENTABLATURE, SOLID CURVED DOME RIBS, & CRYSTAL CHANDELIER
    // ------------------------------------------------------------------------
    const entablatureY = colHeight + 0.06;
    const architrave = new THREE.Mesh(new THREE.TorusGeometry(colRadius, 0.22, 16, 64), marbleMat);
    architrave.rotation.x = Math.PI / 2;
    architrave.position.y = entablatureY;

    const goldFrieze = new THREE.Mesh(new THREE.TorusGeometry(colRadius + 0.05, 0.10, 14, 64), goldMat);
    goldFrieze.rotation.x = Math.PI / 2;
    goldFrieze.position.y = entablatureY + 0.16;

    const upperCornice = new THREE.Mesh(new THREE.TorusGeometry(colRadius + 0.12, 0.16, 16, 64), marbleMat);
    upperCornice.rotation.x = Math.PI / 2;
    upperCornice.position.y = entablatureY + 0.30;

    this.gazeboGroup.add(architrave, goldFrieze, upperCornice);

    // 12 Solid 3D Curved Wrought-Iron & Gold Dome Ribs + Horizontal Concentric Purline Rings
    const domeBaseY = entablatureY + 0.32;
    const ribCount = 12;
    for (let r = 0; r < ribCount; r++) {
      const ribAngle = (r / ribCount) * Math.PI;
      const ribArch = new THREE.Mesh(
        new THREE.TorusGeometry(colRadius, 0.055, 10, 48, Math.PI),
        goldMat
      );
      ribArch.position.y = domeBaseY;
      ribArch.rotation.y = ribAngle;
      this.gazeboGroup.add(ribArch);
    }

    // Concentric horizontal gold rings on the dome
    [0.22, 0.45, 0.68, 0.86].forEach((elevFrac) => {
      const theta = elevFrac * (Math.PI * 0.5);
      const ringR = Math.cos(theta) * colRadius;
      const ringY = domeBaseY + Math.sin(theta) * colRadius;
      const purline = new THREE.Mesh(new THREE.TorusGeometry(ringR, 0.035, 10, 56), goldMat);
      purline.rotation.x = Math.PI / 2;
      purline.position.y = ringY;
      this.gazeboGroup.add(purline);
    });

    // Top Cupola Finial Crown
    const finialBase = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 0.35, 16), goldMat);
    finialBase.position.y = domeBaseY + colRadius + 0.12;
    const finialSpire = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.95, 12), goldMat);
    finialSpire.position.y = domeBaseY + colRadius + 0.75;
    this.gazeboGroup.add(finialBase, finialSpire);

    // Hanging Multi-Tiered Empire Crystal Chandelier
    const chandelier = new THREE.Group();
    chandelier.position.set(0, 4.35, -0.35);

    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.2, 8), goldMat);
    chain.position.y = 1.1;
    chandelier.add(chain);

    const crystalMat = new THREE.MeshBasicMaterial({ color: '#fff8e7' });
    const tierRadii = [0.75, 0.52, 0.28];
    const tierHeights = [0.15, -0.15, -0.42];

    tierRadii.forEach((tr, tIdx) => {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(tr, 0.025, 10, 32), goldMat);
      hoop.rotation.x = Math.PI / 2;
      hoop.position.y = tierHeights[tIdx];
      chandelier.add(hoop);

      const dropCount = 12 - tIdx * 3;
      for (let d = 0; d < dropCount; d++) {
        const da = (d / dropCount) * Math.PI * 2;
        const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), crystalMat);
        crystal.scale.set(0.7, 1.8, 0.7);
        crystal.position.set(Math.cos(da) * tr, tierHeights[tIdx] - 0.11, Math.sin(da) * tr);
        chandelier.add(crystal);
      }
    });

    this.gazeboGroup.add(chandelier);

    // ------------------------------------------------------------------------
    // 4. LUXURY 5-PANEL CURVED ARCH WEDDING PELAMINAN BACKDROP
    // ------------------------------------------------------------------------
    const pelaminan = new THREE.Group();
    pelaminan.position.set(0, 0.06, -2.25);

    // Raised Pelaminan Stage Deck with Gold Trim Step
    const stageDeck = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.14, 1.85), marbleMat);
    stageDeck.position.set(0, 0.07, 0.15);
    const stageGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(6.26, 0.04, 1.90), goldMat);
    stageGoldTrim.position.set(0, 0.13, 0.15);
    pelaminan.add(stageDeck, stageGoldTrim);

    // A) Outer Left & Right Curved Arch Wings (Champagne Velvet + Gold Molding)
    const outerWingL = this.createArchPanelMesh(1.45, 3.15, 0.12, champagneVelvetMat);
    outerWingL.position.set(-2.55, 0.12, 0.18);
    outerWingL.rotation.y = 0.28;
    const outerFrameL = this.createArchPanelMesh(1.55, 3.22, 0.08, goldMat);
    outerFrameL.position.set(-2.57, 0.12, 0.15);
    outerFrameL.rotation.y = 0.28;

    const outerWingR = this.createArchPanelMesh(1.45, 3.15, 0.12, champagneVelvetMat);
    outerWingR.position.set(2.55, 0.12, 0.18);
    outerWingR.rotation.y = -0.28;
    const outerFrameR = this.createArchPanelMesh(1.55, 3.22, 0.08, goldMat);
    outerFrameR.position.set(2.57, 0.12, 0.15);
    outerFrameR.rotation.y = -0.28;

    // B) Inner Left & Right Arched Wings (Ivory Silk + Carved Gold Fretwork Pillars)
    const innerWingL = this.createArchPanelMesh(1.65, 3.55, 0.14, ivorySilkMat);
    innerWingL.position.set(-1.55, 0.12, -0.06);
    innerWingL.rotation.y = 0.12;
    const innerFrameL = this.createArchPanelMesh(1.75, 3.63, 0.10, goldMat);
    innerFrameL.position.set(-1.56, 0.12, -0.09);
    innerFrameL.rotation.y = 0.12;

    const innerWingR = this.createArchPanelMesh(1.65, 3.55, 0.14, ivorySilkMat);
    innerWingR.position.set(1.55, 0.12, -0.06);
    innerWingR.rotation.y = -0.12;
    const innerFrameR = this.createArchPanelMesh(1.75, 3.63, 0.10, goldMat);
    innerFrameR.position.set(1.56, 0.12, -0.09);
    innerFrameR.rotation.y = -0.12;

    // C) Center Grand Arch Wall (Rich Walnut & Gold Arch Molding)
    const centerGrandFrame = this.createArchPanelMesh(3.62, 4.18, 0.16, goldMat);
    centerGrandFrame.position.set(0, 0.12, -0.04);

    const centerGrandWall = this.createArchPanelMesh(3.44, 4.08, 0.18, walnutMat);
    centerGrandWall.position.set(0, 0.12, 0.0);

    // High-Contrast Engraved Wood & Gold Pelaminan Signboard (Positioned cleanly above the Couple)
    const pelaminanTex = this.createWoodBoardTexture(
      [
        { text: 'THE WEDDING OF', font: '500 28px monospace', color: '#f3c677', lineHeight: 74 },
        { text: 'Faris & Vita', font: 'italic 600 88px Georgia, serif', color: '#ffffff', lineHeight: 86 },
        { text: 'Minggu, 10 Januari 2027 • Surabaya', font: '500 34px sans-serif', color: '#f3c677', lineHeight: 74 },
        { text: '“Terima kasih atas doa restu & kehadiran Anda”', font: 'italic 400 36px Georgia, serif', color: '#fff9f0', lineHeight: 54 }
      ],
      'center'
    );
    const pelaminanSign = new THREE.Mesh(
      new THREE.PlaneGeometry(3.15, 2.02),
      new THREE.MeshBasicMaterial({ map: pelaminanTex })
    );
    pelaminanSign.position.set(0, 2.42, 0.145);

    pelaminan.add(
      outerFrameL,
      outerWingL,
      outerFrameR,
      outerWingR,
      innerFrameL,
      innerWingL,
      innerFrameR,
      innerWingR,
      centerGrandFrame,
      centerGrandWall,
      pelaminanSign
    );

    // ------------------------------------------------------------------------
    // 5. LUSH REALISTIC FLORAL INSTALLATIONS, GOLD URNS & CANDLE LANTERNS
    // ------------------------------------------------------------------------
    // Top Crown Floral Swag following the Grand Arch curve
    const topArchFlorals = this.createLushFloralCluster(3.6, 34);
    topArchFlorals.position.set(0, 3.88, 0.18);
    pelaminan.add(topArchFlorals);

    // Left & Right Cascading Wing Floral Swags
    const leftWingFlorals = this.createLushFloralCluster(2.1, 20);
    leftWingFlorals.position.set(-2.15, 3.15, 0.24);
    leftWingFlorals.rotation.z = 0.38;
    leftWingFlorals.rotation.y = 0.2;

    const rightWingFlorals = this.createLushFloralCluster(2.1, 20);
    rightWingFlorals.position.set(2.15, 3.15, 0.24);
    rightWingFlorals.rotation.z = -0.38;
    rightWingFlorals.rotation.y = -0.2;
    pelaminan.add(leftWingFlorals, rightWingFlorals);

    // Ground Meadow Floral Runner along Left & Right of Stage Floor
    const groundFloralL = this.createLushFloralCluster(2.2, 22);
    groundFloralL.position.set(-1.95, 0.24, 0.72);
    const groundFloralR = this.createLushFloralCluster(2.2, 22);
    groundFloralR.position.set(1.95, 0.24, 0.72);
    pelaminan.add(groundFloralL, groundFloralR);

    // 4 Luxury Gold Geometric Pedestals with Classical Floral Urns
    const pedestalConfigs = [
      { x: -1.42, h: 1.25, z: 0.42 },
      { x: -2.25, h: 0.95, z: 0.58 },
      { x: 1.42, h: 1.25, z: 0.42 },
      { x: 2.25, h: 0.95, z: 0.58 }
    ];

    pedestalConfigs.forEach((pc) => {
      const pedGroup = new THREE.Group();
      pedGroup.position.set(pc.x, 0.14, pc.z);

      // Open Gold Geometric Frame Stand + Marble Top Plate
      const topPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), marbleMat);
      topPlate.position.y = pc.h;
      const botPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.04, 0.44), goldMat);
      botPlate.position.y = 0.02;

      [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([lx, lz]) => {
        const legBar = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, pc.h, 8), goldMat);
        legBar.position.set(lx, pc.h * 0.5, lz);
        pedGroup.add(legBar);
      });

      // Gold Classical Urn Vase
      const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.10, 0.28, 16), goldMat);
      urn.position.y = pc.h + 0.15;

      // Overflowing Floral Bouquet on top of the Urn
      const urnBouquet = this.createLushFloralCluster(0.65, 12);
      urnBouquet.position.y = pc.h + 0.36;

      pedGroup.add(topPlate, botPlate, urn, urnBouquet);
      pelaminan.add(pedGroup);
    });

    // Warm Glowing Pillar Candles in Gold Hurricane Lanterns along the Stage Steps
    const candleMat = new THREE.MeshBasicMaterial({ color: '#fff5d6' });
    const flameMat = new THREE.MeshBasicMaterial({ color: '#ffbe42' });
    [-1.15, -0.92, 0.92, 1.15].forEach((cx, idx) => {
      const ch = 0.22 + (idx % 2) * 0.10;
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, ch, 12), candleMat);
      candle.position.set(cx, 0.14 + ch * 0.5, 0.85 + (idx % 2) * 0.12);
      const flame = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), flameMat);
      flame.scale.set(0.7, 1.6, 0.7);
      flame.position.set(cx, 0.14 + ch + 0.025, 0.85 + (idx % 2) * 0.12);
      pelaminan.add(candle, flame);
    });

    this.gazeboGroup.add(pelaminan);

    // Warm Chandelier + Pelaminan Stage Uplights
    const chandelierLight = new THREE.PointLight('#ffe5b4', 5.2, 26);
    chandelierLight.position.set(0, 4.2, 0);
    const stageWarmLight = new THREE.PointLight('#ffdca2', 3.5, 14);
    stageWarmLight.position.set(0, 2.8, -0.8);
    this.gazeboGroup.add(chandelierLight, stageWarmLight);

    this.scene.add(this.gazeboGroup);
  }

  buildFirefliesAndPetals() {
    const count = this.isLowSpec ? 160 : 420;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);

    const pt = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 0.94;
      this.cameraCurve.getPointAt(t, pt);
      positions[i * 3] = pt.x + (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = pt.y - 1.2 + Math.random() * 6.0;
      positions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 14;
      scales[i] = 0.5 + Math.random() * 1.4;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

    this.fireflyUniforms = {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
    };

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: this.fireflyUniforms,
      vertexShader: `
        attribute float aScale;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vAlpha;

        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 1.3 + pos.x * 1.8) * 0.26;
          pos.x += cos(uTime * 1.0 + pos.z * 1.4) * 0.22;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = (24.0 * aScale * uPixelRatio) / -mvPosition.z;
          vAlpha = 0.4 + 0.6 * sin(uTime * 2.2 + aScale * 6.0);
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          float strength = smoothstep(0.5, 0.05, d);
          vec3 col = mix(vec3(1.0, 0.82, 0.55), vec3(1.0, 0.98, 0.92), strength);
          gl_FragColor = vec4(col, strength * vAlpha);
        }
      `
    });

    this.fireflies = new THREE.Points(geo, mat);
    this.scene.add(this.fireflies);
  }

  initPointerParallax() {
    this.boundPointerMove = (e) => {
      this.pointer.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      this.pointer.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('pointermove', this.boundPointerMove, { passive: true });
  }

  destroy() {
    if (this.boundResize) {
      window.removeEventListener('resize', this.boundResize);
    }
    if (this.boundPointerMove) {
      window.removeEventListener('pointermove', this.boundPointerMove);
    }
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
    }
  }

  setScrollProgress(p) {
    this.scrollProgress = THREE.MathUtils.clamp(p, 0, 1);
  }

  setGateOpen(val) {
    this.gateOpenProgress = val;
  }

  updateAtmosphereByProgress(p) {
    const stages = this.parsedStages;
    const scaled = p * (stages.length - 1);
    const idx = Math.min(Math.floor(scaled), stages.length - 2);
    const frac = scaled - idx;

    this._cTop.copy(stages[idx].top).lerp(stages[idx + 1].top, frac);
    this._cMid.copy(stages[idx].mid).lerp(stages[idx + 1].mid, frac);
    this._cHor.copy(stages[idx].hor).lerp(stages[idx + 1].hor, frac);
    this._cFog.copy(stages[idx].fog).lerp(stages[idx + 1].fog, frac);

    this.skyUniforms.uTopColor.value.copy(this._cTop);
    this.skyUniforms.uMidColor.value.copy(this._cMid);
    this.skyUniforms.uHorizonColor.value.copy(this._cHor);
    this.scene.fog.color.copy(this._cFog);
  }

  handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isPortrait = w < h;

    this.baseFov = isPortrait ? 62 : 48;
    this.camera.fov = this.baseFov;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    const maxDpr = this.isLowSpec ? 1.0 : (this.isMobile ? 1.25 : 1.75);
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(dpr);
    if (this.fireflyUniforms) {
      this.fireflyUniforms.uPixelRatio.value = dpr;
    }
  }

  render() {
    const elapsed = this.clock.getElapsedTime();
    this.fireflyUniforms.uTime.value = elapsed;

    const prevSmooth = this.smoothProgress;
    this.smoothProgress += (this.scrollProgress - this.smoothProgress) * 0.075;
    const speed = this.smoothProgress - prevSmooth;

    this.pointer.x += (this.pointer.targetX - this.pointer.x) * 0.06;
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * 0.06;

    if (this.gateLeftPivot && this.gateRightPivot) {
      const openAngle = this.gateOpenProgress * (Math.PI * 0.65);
      this.gateLeftPivot.rotation.y = -openAngle;
      this.gateRightPivot.rotation.y = openAngle;
    }

    const gazeboTurn = THREE.MathUtils.smoothstep(this.smoothProgress, 0.86, 0.96);
    const walkFactor = 1.0 - gazeboTurn;

    const coupleT = 0.055 + this.smoothProgress * 0.84;
    const camGap = THREE.MathUtils.lerp(0.055, 0.042, gazeboTurn);
    const camT = Math.max(0.0, coupleT - camGap);

    this.cameraCurve.getPointAt(coupleT, this._couplePos);
    this.cameraCurve.getTangentAt(coupleT, this._coupleTangent);
    this.cameraCurve.getPointAt(camT, this._camPos);
    const couplePos = this._couplePos;
    const coupleTangent = this._coupleTangent;
    const camPos = this._camPos;

    const walkActivity = Math.min(Math.abs(speed) * 450, 1.0) * walkFactor;
    this.walkCycle += (0.045 + Math.abs(speed) * 36.0) * walkFactor;

    const stepBounce = Math.abs(Math.sin(this.walkCycle)) * (0.018 + walkActivity * 0.035) * walkFactor;
    this.coupleGroup.position.set(
      couplePos.x,
      couplePos.y - 1.76 + stepBounce,
      couplePos.z
    );

    const targetCoupleYaw = Math.atan2(coupleTangent.x, coupleTangent.z) + Math.PI;
    this.coupleGroup.rotation.y = targetCoupleYaw;

    this.groom.rotation.y = gazeboTurn * Math.PI;
    this.bride.rotation.y = -gazeboTurn * Math.PI;

    const strideAmp = (0.28 + walkActivity * 0.45) * walkFactor;
    const legAngle = Math.sin(this.walkCycle) * strideAmp;
    this.groomLeftLeg.rotation.x = legAngle;
    this.groomRightLeg.rotation.x = -legAngle;
    if (this.brideLeftLeg && this.brideRightLeg) {
      this.brideLeftLeg.rotation.x = -legAngle * 0.75;
      this.brideRightLeg.rotation.x = legAngle * 0.75;
    }

    const waveOscGroom = Math.sin(elapsed * 7.2) * 0.30 * gazeboTurn;
    const waveOscBride = Math.sin(elapsed * 7.2 + 0.6) * 0.30 * gazeboTurn;

    // Roblox Blocky Arm Waving at Gazebo
    this.groomRightArm.rotation.z = THREE.MathUtils.lerp(-0.22, 2.52, gazeboTurn) + waveOscGroom;
    this.groomRightArm.rotation.x = THREE.MathUtils.lerp(0, -0.12, gazeboTurn);

    this.groomLeftArm.rotation.x = -legAngle * 0.85;
    this.groomLeftArm.rotation.z = THREE.MathUtils.lerp(0, -0.22, gazeboTurn);

    this.brideLeftArm.rotation.z = THREE.MathUtils.lerp(0.22, -2.52, gazeboTurn) + waveOscBride;
    this.brideLeftArm.rotation.x = THREE.MathUtils.lerp(0, -0.12, gazeboTurn);

    this.brideRightArm.rotation.x = -0.38 + Math.sin(this.walkCycle) * 0.10 * walkFactor;
    this.brideRightArm.rotation.z = THREE.MathUtils.lerp(-0.15, 0.18, gazeboTurn);

    // Cute Roblox Head Tilt when Waving at Gazebo
    if (this.groomHeadGroup && this.brideHeadGroup) {
      this.groomHeadGroup.rotation.z = Math.sin(elapsed * 3.6) * 0.06 * gazeboTurn;
      this.brideHeadGroup.rotation.z = -Math.sin(elapsed * 3.6) * 0.06 * gazeboTurn;
    }

    this.brideSkirt.rotation.z = Math.sin(this.walkCycle) * 0.03 * walkFactor;
    this.brideSkirt.rotation.x = Math.abs(Math.cos(this.walkCycle)) * 0.035 * walkFactor;
    this.brideVeil.rotation.x = 0.22 + walkActivity * 0.26 + Math.sin(elapsed * 2.6) * 0.05;

    this.camera.position.set(
      camPos.x + this.pointer.x * 0.4,
      camPos.y + 0.14 - this.pointer.y * 0.2,
      camPos.z
    );

    const forwardTargetX = couplePos.x + coupleTangent.x * 3.5 + this.pointer.x * 0.5;
    const forwardTargetY = couplePos.y - 0.38 - this.pointer.y * 0.25;
    const forwardTargetZ = couplePos.z + coupleTangent.z * 3.5;

    this.camera.lookAt(forwardTargetX, forwardTargetY, forwardTargetZ);

    const curveBank = (couplePos.x - camPos.x) * -0.028;
    this.camera.rotation.z += curveBank - this.pointer.x * 0.02;

    const targetFov = this.baseFov + Math.min(Math.abs(speed) * 350, 7);
    this.camera.fov += (targetFov - this.camera.fov) * 0.1;
    this.camera.updateProjectionMatrix();

    this.skyMesh.position.copy(this.camera.position);

    for (const item of this.floatingFrames) {
      item.group.position.y = item.baseY + Math.sin(elapsed * 1.5 + item.phase) * 0.07;
    }
    for (const cl of this.cloudGroups) {
      cl.group.position.y = cl.baseY + Math.sin(elapsed * 0.55 + cl.phase) * 0.24;
      if (cl.baseX !== undefined) {
        cl.group.position.x = cl.baseX + Math.sin(elapsed * (cl.driftSpeed || 0.16) + cl.phase) * 0.65;
      }
    }
    if (!this.isLowSpec) {
      for (const tc of this.treeCrowns) {
        tc.group.rotation.z = Math.sin(elapsed * 1.15 + tc.phase) * 0.022;
        tc.group.rotation.x = Math.cos(elapsed * 0.9 + tc.phase) * 0.016;
      }
    }

    this.updateAtmosphereByProgress(this.smoothProgress);
    this.renderer.render(this.scene, this.camera);
  }
}
