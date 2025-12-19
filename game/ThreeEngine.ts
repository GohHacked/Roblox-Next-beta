import * as THREE from 'three';
import { LevelType, GameSettings, PlayerAppearance } from '../types';

export class ThreeEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationId: number | null = null;
  private container: HTMLElement;

  // Game Objects
  private playerGroup: THREE.Group = new THREE.Group();
  private torsoGroup: THREE.Group = new THREE.Group(); 
  private headGroup: THREE.Group = new THREE.Group();
  private parts: { [key: string]: THREE.Group } = {};
  private platforms: THREE.Mesh[] = [];

  // Materials for Player (Dynamic)
  private materials = {
      skin: new THREE.MeshLambertMaterial({ color: 0xffcd38 }),
      shirt: new THREE.MeshLambertMaterial({ color: 0x0088ff }),
      pants: new THREE.MeshLambertMaterial({ color: 0x228b22 })
  };
  
  // Physics & State
  private velocity = { x: 0, y: 0, z: 0 };
  private gravity = 0.022; // Increased gravity for snappier feel
  private onGround = false;
  private checkpoint = { x: 0, y: 5, z: 0 };
  private keys = { w: false, a: false, s: false, d: false, space: false };
  private cameraAngle = { x: 0, y: 0 };
  private isFirstSpawn = true;
  private controlsActive = true;
  private hasWon = false;
  private username: string; // Store username
  
  // Mobile Input State
  private joystickVector = { x: 0, y: 0 };
  
  // Animation State
  private animCurrent = { legL: 0, legR: 0, armL: 0, armR: 0, bodyY: 0 };
  private walkTimer = 0;

  // Audio System
  private audioContext: AudioContext | null = null;
  private lastStepTime = 0;
  private volume = 0.5;

  // Callbacks
  private onPause: () => void;
  private onWin: () => void;

  constructor(container: HTMLElement, username: string, onPause: () => void, onWin: () => void) {
    this.container = container;
    this.username = username; // Init username
    this.onPause = onPause;
    this.onWin = onWin;

    // Init Audio Context
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('AudioContext not supported');
    }

    // Init Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 20, 100);

    // Init Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Init Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 500;
    dirLight.shadow.bias = -0.0005; 
    this.scene.add(dirLight);

    this.createPlayer();
    this.setupInputs();
    
    window.addEventListener('resize', this.handleResize);
  }

  // --- Controls State ---
  public setControlsActive(active: boolean) {
      this.controlsActive = active;
      if (!active) {
          // Reset keys if controls are disabled (e.g. typing in chat)
          this.keys = { w: false, a: false, s: false, d: false, space: false };
      }
  }

  // --- Appearance ---
  public setAppearance(appearance: PlayerAppearance) {
      this.materials.skin.color.set(appearance.skin);
      this.materials.shirt.color.set(appearance.shirt);
      this.materials.pants.color.set(appearance.pants);
  }

  // --- Sound Generation ---
  private playSound(type: 'jump' | 'step' | 'death') {
    if (!this.audioContext || this.volume <= 0) return;
    
    if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
    }

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;

    if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(this.volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } 
    else if (type === 'step') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);
        gain.gain.setValueAtTime(this.volume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'death') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(this.volume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
  }

  private handleResize = () => {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private createNameTag(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // High resolution for sharp text
    const width = 512;
    const height = 128;
    canvas.width = width;
    canvas.height = height;

    if (ctx) {
        ctx.clearRect(0, 0, width, height);
        
        // Text Settings
        ctx.font = 'bold 60px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Stroke (Outline)
        ctx.lineWidth = 6;
        ctx.strokeStyle = 'black';
        ctx.strokeText(text, width / 2, height / 2);
        
        // Fill (Main Color)
        ctx.fillStyle = 'white';
        ctx.fillText(text, width / 2, height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter; // Smoother scaling
    
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        depthTest: false // Allow seeing through walls like Roblox
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    
    // Scale sprite down to world units
    sprite.scale.set(4, 1, 1);
    sprite.position.y = 4.2; // Above head
    
    return sprite;
  }

  private createPlayer() {
    this.playerGroup = new THREE.Group();

    // Use shared dynamic materials
    const skin = this.materials.skin;
    const shirt = this.materials.shirt;
    const pants = this.materials.pants;

    // Helper to create body parts
    const createPart = (w: number, h: number, d: number, mat: THREE.Material, y: number, name: string) => {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      const group = new THREE.Group();
      // Pivot point logic
      group.position.y = y;
      mesh.position.y = -h / 2;
      
      group.add(mesh);
      this.parts[name] = group;
      return group;
    };

    // -- Torso --
    this.torsoGroup = new THREE.Group();
    this.torsoGroup.position.y = 1;
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 1), shirt);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torsoGroup.add(torsoMesh);
    this.playerGroup.add(this.torsoGroup);

    // -- Head --
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 2.6;
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), skin);
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    this.headGroup.add(headMesh);
    this.playerGroup.add(this.headGroup);

    // -- Name Tag --
    const nameTag = this.createNameTag(this.username);
    this.playerGroup.add(nameTag);

    // -- Limbs --
    const armL = createPart(1, 2, 1, skin, 2, 'armL'); armL.position.x = -1.5;
    const armR = createPart(1, 2, 1, skin, 2, 'armR'); armR.position.x = 1.5;
    const legL = createPart(1, 2, 1, pants, 0, 'legL'); legL.position.x = -0.5;
    const legR = createPart(1, 2, 1, pants, 0, 'legR'); legR.position.x = 0.5;

    this.playerGroup.add(armL, armR, legL, legR);
    this.scene.add(this.playerGroup);
  }

  public loadLevel(type: LevelType) {
    this.isFirstSpawn = true;
    this.hasWon = false;
    this.platforms.forEach(p => {
        this.scene.remove(p);
        if (p.geometry) p.geometry.dispose();
        if (Array.isArray(p.material)) p.material.forEach(m => m.dispose());
        else (p.material as THREE.Material).dispose();
    });
    this.platforms = [];

    // Reset Physics defaults
    this.gravity = 0.022;
    this.scene.background = new THREE.Color(0x87CEEB);
    (this.scene.fog as THREE.Fog).color.setHex(0x87CEEB);

    // Default Platform
    this.createPlat(0, -2, 0, 10, 1, 10, 0x555555);

    // Rainbow Obby Generation (Default)
    let z = -8;
    for(let i=0; i<50; i++) {
        const color = new THREE.Color().setHSL(i/30, 1, 0.5);
        // Add some variety in jumps
        const gap = 6 + (i % 3); 
        const height = (i % 5 === 0) ? 1 : 0;
        
        this.createPlat((Math.random()-0.5)*5, height, z, 5, 1, 5, color.getHex());
        z -= gap;
    }
    
    // Victory Platform
    this.createPlat(0, 0, z - 5, 15, 1, 15, 0xFFD700);
    // Mark the last created platform as victory
    if (this.platforms.length > 0) {
        this.platforms[this.platforms.length - 1].userData.isVictory = true;
    }

    this.checkpoint = { x: 0, y: 5, z: 0 };
    this.respawn();
    this.isFirstSpawn = false;
  }

  private createPlat(x: number, y: number, z: number, w: number, h: number, d: number, color: number, isGlass=false, isSafe=true) {
    const mat = new THREE.MeshLambertMaterial({ 
        color: color, 
        transparent: isGlass, 
        opacity: isGlass ? 0.6 : 1 
    });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    mesh.position.set(x, y, z);
    
    mesh.userData = { w, h, d, top: y+h/2, isGlass, isSafe, isVictory: false };
    
    if(!isGlass) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
    }
    
    this.scene.add(mesh);
    this.platforms.push(mesh);
  }

  private respawn() {
    if (!this.isFirstSpawn && !this.hasWon) {
        this.playSound('death');
    }
    this.playerGroup.position.set(this.checkpoint.x, this.checkpoint.y, this.checkpoint.z);
    this.velocity = { x: 0, y: 0, z: 0 };
    this.cameraAngle.y = 0;
  }

  private setupInputs() {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
  }

  private removeInputs() {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.controlsActive) return;

    if (e.code === 'KeyW') this.keys.w = true;
    if (e.code === 'KeyS') this.keys.s = true;
    if (e.code === 'KeyA') this.keys.a = true;
    if (e.code === 'KeyD') this.keys.d = true;
    if (e.code === 'Space') {
       this.jump();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    // We process key up even if controls inactive to prevent "stuck" keys when closing chat
    if (e.code === 'KeyW') this.keys.w = false;
    if (e.code === 'KeyS') this.keys.s = false;
    if (e.code === 'KeyA') this.keys.a = false;
    if (e.code === 'KeyD') this.keys.d = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement === this.container || document.pointerLockElement === document.body) {
        this.cameraAngle.x -= e.movementX * 0.003;
        this.cameraAngle.y -= e.movementY * 0.003;
        this.cameraAngle.y = Math.max(-1, Math.min(0.5, this.cameraAngle.y));
    }
  };

  public setJoystick(x: number, y: number) {
    if (!this.controlsActive) return;
    this.joystickVector = { x, y };
  }

  public moveCamera(dx: number, dy: number) {
    this.cameraAngle.x -= dx * 0.005;
    this.cameraAngle.y -= dy * 0.005;
    this.cameraAngle.y = Math.max(-1, Math.min(0.5, this.cameraAngle.y));
  }

  public jump() {
     if (!this.controlsActive || this.hasWon) return;

     if (this.audioContext && this.audioContext.state === 'suspended') {
         this.audioContext.resume().catch(() => {});
     }

     if (this.onGround) {
        this.velocity.y = 0.55; // Higher jump
        this.playSound('jump');
     }
  }

  public requestPointerLock() {
    this.container.requestPointerLock();
  }

  public updateSettings(settings: GameSettings) {
    this.volume = settings.volume / 100;

    if (this.camera) {
        this.camera.fov = settings.fov;
        this.camera.updateProjectionMatrix();
    }

    if (settings.graphics === 'low') {
        this.renderer.setPixelRatio(0.8);
        this.renderer.shadowMap.enabled = false;
    } else if (settings.graphics === 'medium') {
        this.renderer.setPixelRatio(1.0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;
    } else {
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    if (!settings.shadows && settings.graphics !== 'low') {
         this.renderer.shadowMap.enabled = false;
    }
    
    this.scene.traverse((obj) => {
        if(obj instanceof THREE.Mesh) {
            obj.castShadow = this.renderer.shadowMap.enabled;
            obj.receiveShadow = this.renderer.shadowMap.enabled;
            if(obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.needsUpdate = true);
                } else {
                    (obj.material as THREE.Material).needsUpdate = true;
                }
            }
        }
    });
  }

  public start() {
    if (!this.animationId) {
        this.animate();
    }
  }

  public stop() {
    if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
    }
  }

  private update() {
    // 1. Physics
    const prevPos = this.playerGroup.position.clone();
    
    this.velocity.y -= this.gravity;
    this.velocity.y = Math.max(this.velocity.y, -1.0); 

    this.playerGroup.position.y += this.velocity.y;

    this.onGround = false;
    const px = this.playerGroup.position.x;
    const pz = this.playerGroup.position.z;
    
    const playerFeetOffset = 2.0;
    const currentFeetY = this.playerGroup.position.y - playerFeetOffset;
    const prevFeetY = prevPos.y - playerFeetOffset;

    const radius = 0.5;

    for (const p of this.platforms) {
        const data = p.userData;
        
        const pLeft = p.position.x - data.w / 2;
        const pRight = p.position.x + data.w / 2;
        const pBack = p.position.z - data.d / 2;
        const pFront = p.position.z + data.d / 2;

        if (px + radius > pLeft && px - radius < pRight &&
            pz + radius > pBack && pz - radius < pFront) {
            
            if (this.velocity.y <= 0) {
                 const platformTop = data.top;
                 if (currentFeetY <= platformTop + 0.1 && prevFeetY >= platformTop - 1.0) {
                    if (data.isGlass && !data.isSafe) {
                        (p.material as THREE.MeshLambertMaterial).opacity = 0.1; 
                        (p.material as THREE.MeshLambertMaterial).transparent = true;
                        p.userData.isSafe = false; 
                        continue; 
                    }
                    
                    this.onGround = true;
                    this.velocity.y = 0;
                    this.playerGroup.position.y = platformTop + playerFeetOffset;
                    
                    // CHECK VICTORY
                    if (data.isVictory && !this.hasWon) {
                        this.hasWon = true;
                        this.onWin();
                        if (document.pointerLockElement) {
                             document.exitPointerLock();
                        }
                    }
                    break;
                 }
            }
        }
    }

    if (this.playerGroup.position.y < -30) this.respawn();

    // 2. Movement
    let move = false;
    const speed = 0.2;
    let dx = 0, dz = 0;

    let moveFwd = 0;
    let moveSide = 0;

    if (this.controlsActive && !this.hasWon) {
        if (this.keys.w) moveFwd += 1;
        if (this.keys.s) moveFwd -= 1;
        if (this.keys.a) moveSide -= 1;
        if (this.keys.d) moveSide += 1;

        moveFwd += this.joystickVector.y;
        moveSide += this.joystickVector.x;
    }

    if (Math.abs(moveFwd) > 0.1 || Math.abs(moveSide) > 0.1) {
        move = true;
        dx += moveFwd * Math.sin(this.cameraAngle.x);
        dz += moveFwd * Math.cos(this.cameraAngle.x);
        dx += moveSide * Math.sin(this.cameraAngle.x - Math.PI/2);
        dz += moveSide * Math.cos(this.cameraAngle.x - Math.PI/2);
    }

    if (move) {
        this.playerGroup.position.x -= dx * speed;
        this.playerGroup.position.z -= dz * speed;

        if (Math.abs(dx) > 0.001 || Math.abs(dz) > 0.001) {
            this.playerGroup.rotation.y = Math.atan2(-dx, -dz);
        }

        if (this.onGround) {
            const now = Date.now();
            if (now - this.lastStepTime > 350) {
                this.playSound('step');
                this.lastStepTime = now;
            }
        }
    }

    // 3. IMPROVED ANIMATIONS
    let animTarget = { legL: 0, legR: 0, armL: 0, armR: 0, bodyY: 0 };
    
    if (this.hasWon) {
         // Victory Dance
        const time = Date.now() * 0.01;
        animTarget = { 
            legL: 0, 
            legR: 0, 
            armL: Math.sin(time) * 2.5, 
            armR: Math.sin(time + Math.PI) * 2.5,
            bodyY: Math.abs(Math.sin(time * 0.5)) * 0.5
        };
        this.playerGroup.rotation.y += 0.05;
    }
    else if (!this.onGround) {
        animTarget = { 
            legL: -0.5, 
            legR: 0.2, 
            armL: 2.8,  
            armR: 2.8,
            bodyY: 0.1 
        };
    } else if (move) {
        this.walkTimer += 0.2;
        const swingRange = 1.0; 
        animTarget = { 
            legL: Math.sin(this.walkTimer) * swingRange,
            legR: Math.sin(this.walkTimer + Math.PI) * swingRange,
            armL: Math.sin(this.walkTimer + Math.PI) * swingRange,
            armR: Math.sin(this.walkTimer) * swingRange,
            bodyY: Math.abs(Math.sin(this.walkTimer)) * 0.1
        };
    } else {
        const time = Date.now() * 0.002;
        animTarget = { 
            legL: 0, 
            legR: 0, 
            armL: Math.sin(time) * 0.05, 
            armR: Math.sin(time + Math.PI) * 0.05,
            bodyY: Math.sin(time * 2) * 0.02
        };
    }

    const animSpeed = 0.2;
    const lerp = (start: number, end: number, amt: number) => (1 - amt) * start + amt * end;
    
    this.animCurrent.legL = lerp(this.animCurrent.legL, animTarget.legL, animSpeed);
    this.animCurrent.legR = lerp(this.animCurrent.legR, animTarget.legR, animSpeed);
    this.animCurrent.armL = lerp(this.animCurrent.armL, animTarget.armL, animSpeed);
    this.animCurrent.armR = lerp(this.animCurrent.armR, animTarget.armR, animSpeed);
    this.animCurrent.bodyY = lerp(this.animCurrent.bodyY, animTarget.bodyY, animSpeed);

    if (this.parts.legL) this.parts.legL.rotation.x = this.animCurrent.legL;
    if (this.parts.legR) this.parts.legR.rotation.x = this.animCurrent.legR;
    if (this.parts.armL) this.parts.armL.rotation.x = this.animCurrent.armL;
    if (this.parts.armR) this.parts.armR.rotation.x = this.animCurrent.armR;
    
    if (this.torsoGroup) this.torsoGroup.position.y = 1 + this.animCurrent.bodyY;
    if (this.headGroup) this.headGroup.position.y = 2.6 + this.animCurrent.bodyY;
    if (this.parts.armL) this.parts.armL.position.y = 2 + this.animCurrent.bodyY;
    if (this.parts.armR) this.parts.armR.position.y = 2 + this.animCurrent.bodyY;

    // 4. Camera Update
    const dist = 8;
    this.camera.position.x = this.playerGroup.position.x + Math.sin(this.cameraAngle.x) * dist * Math.cos(this.cameraAngle.y);
    this.camera.position.z = this.playerGroup.position.z + Math.cos(this.cameraAngle.x) * dist * Math.cos(this.cameraAngle.y);
    this.camera.position.y = this.playerGroup.position.y + 4 + Math.sin(this.cameraAngle.y) * dist;
    this.camera.lookAt(this.playerGroup.position.x, this.playerGroup.position.y + 2, this.playerGroup.position.z);
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    this.stop();
    this.removeInputs();
    window.removeEventListener('resize', this.handleResize);
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close();
    }

    this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
            else (obj.material as THREE.Material).dispose();
        }
        if (obj instanceof THREE.Sprite) {
           if (obj.material.map) obj.material.map.dispose();
           obj.material.dispose();
        }
    });

    if (this.renderer.domElement.parentElement === this.container) {
        this.container.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}