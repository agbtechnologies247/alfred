import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Line, Sphere, Html } from '@react-three/drei';
import * as THREE from 'three';

// 5 core nodes coordinates (Observe, Understand, Decide, Act, Learn)
const NODES = [
  { pos: new THREE.Vector3(-3.2, 1.2, 0), color: '#06b6d4', name: 'Observe' },
  { pos: new THREE.Vector3(-2.0, -1.6, 0.5), color: '#8b5cf6', name: 'Understand' },
  { pos: new THREE.Vector3(2.0, -1.6, 0.5), color: '#e11d48', name: 'Decide' },
  { pos: new THREE.Vector3(3.2, 1.2, 0), color: '#f59e0b', name: 'Act' },
  { pos: new THREE.Vector3(0, 2.8, -0.5), color: '#10b981', name: 'Learn' },
];

// Custom cubic ease-in-out curve to make movements look natural and fluid
const easeInOutCubic = (x: number): number => {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// Camera Transition controller mapping scroll states
function SceneController({ activeStep }: { activeStep: number | null }) {
  const { camera } = useThree();
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetPos = useRef(new THREE.Vector3(0, 0, 8.5));

  useFrame(() => {
    let pos = new THREE.Vector3(0, 0, 8.5);
    let look = new THREE.Vector3(0, 0, 0);

    if (activeStep !== null && activeStep >= 0 && activeStep < NODES.length) {
      const node = NODES[activeStep];
      // Zoom closer and focus directly on the active step
      pos.copy(node.pos).add(new THREE.Vector3(0, 0, 3.2));
      look.copy(node.pos);
    } else {
      // General overview
      pos.set(0, 0.4, 8);
      look.set(0, 0.4, 0);
    }

    targetPos.current.lerp(pos, 0.06);
    targetLookAt.current.lerp(look, 0.06);

    camera.position.copy(targetPos.current);
    camera.lookAt(targetLookAt.current);
  });

  return null;
}

// 1. Observe Node: Icosahedron with outer ring
function ObserveNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = NODES[0].color;
  const opacity = active ? 1.0 : 0.25;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Slow float/breath oscillation
      groupRef.current.position.y = NODES[0].pos.y + Math.sin(t * 1.5) * 0.07;
      groupRef.current.position.z = NODES[0].pos.z + Math.cos(t * 1.2) * 0.04;
      
      // Dual-axis rotation
      groupRef.current.rotation.y = t * 0.4;
      groupRef.current.rotation.x = t * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = -t * 0.3;
      ringRef.current.rotation.y = t * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[0.18, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </Sphere>
      <mesh>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity * 0.8} />
      </mesh>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.6, 0.02, 8, 48]} />
        <meshBasicMaterial color={color} transparent opacity={opacity * 0.6} />
      </mesh>
    </group>
  );
}

// 2. Understand Node: Constellation network
function UnderstandNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = NODES[1].color;
  const opacity = active ? 1.0 : 0.25;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Slow float/breath oscillation
      groupRef.current.position.y = NODES[1].pos.y + Math.sin(t * 1.3) * 0.06;
      groupRef.current.position.z = NODES[1].pos.z + Math.cos(t * 1.4) * 0.05;
      
      groupRef.current.rotation.y = t * 0.25;
      groupRef.current.rotation.z = t * 0.08;
    }
  });

  const vertices = [
    new THREE.Vector3(0, 0, 0),        // Core
    new THREE.Vector3(0.3, 0.24, 0.12),  // Node A
    new THREE.Vector3(-0.24, 0.3, -0.18), // Node B
    new THREE.Vector3(0.18, -0.3, 0.24),  // Node C
    new THREE.Vector3(-0.3, -0.24, -0.12), // Node D
    new THREE.Vector3(0.36, -0.12, -0.24), // Node E
  ];

  return (
    <group ref={groupRef}>
      {vertices.map((v, i) => (
        <mesh key={i} position={v}>
          <sphereGeometry args={[i === 0 ? 0.25 : 0.08, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      ))}
      <Line points={[vertices[0], vertices[1]]} color={color} lineWidth={1.5} transparent opacity={opacity * 0.6} />
      <Line points={[vertices[0], vertices[2]]} color={color} lineWidth={1.5} transparent opacity={opacity * 0.6} />
      <Line points={[vertices[0], vertices[3]]} color={color} lineWidth={1.5} transparent opacity={opacity * 0.6} />
      <Line points={[vertices[0], vertices[4]]} color={color} lineWidth={1.5} transparent opacity={opacity * 0.6} />
      <Line points={[vertices[0], vertices[5]]} color={color} lineWidth={1.5} transparent opacity={opacity * 0.6} />
      <Line points={[vertices[1], vertices[2]]} color={color} lineWidth={1} transparent opacity={opacity * 0.4} />
      <Line points={[vertices[2], vertices[4]]} color={color} lineWidth={1} transparent opacity={opacity * 0.4} />
      <Line points={[vertices[3], vertices[5]]} color={color} lineWidth={1} transparent opacity={opacity * 0.4} />
    </group>
  );
}

// 3. Decide Node: Stellated octahedron
function DecideNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);
  const color = NODES[2].color;
  const opacity = active ? 1.0 : 0.25;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = NODES[2].pos.y + Math.sin(t * 1.4) * 0.07;
      groupRef.current.position.z = NODES[2].pos.z + Math.cos(t * 1.6) * 0.04;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = t * 0.6;
      innerRef.current.rotation.z = t * 0.3;
    }
    if (outerRef.current) {
      outerRef.current.rotation.y = -t * 0.3;
      outerRef.current.rotation.x = t * 0.15;
    }
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[0.15, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </Sphere>
      <mesh ref={innerRef}>
        <octahedronGeometry args={[0.36]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity * 0.8} />
      </mesh>
      <mesh ref={outerRef}>
        <octahedronGeometry args={[0.54]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity * 0.5} />
      </mesh>
    </group>
  );
}

// 4. Act Node: Gear system
function ActNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const gear1 = useRef<THREE.Mesh>(null);
  const gear2 = useRef<THREE.Mesh>(null);
  const color = NODES[3].color;
  const opacity = active ? 1.0 : 0.25;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = NODES[3].pos.y + Math.sin(t * 1.6) * 0.06;
      groupRef.current.position.z = NODES[3].pos.z + Math.cos(t * 1.3) * 0.05;
    }
    if (gear1.current) gear1.current.rotation.x = t * 0.6;
    if (gear2.current) gear2.current.rotation.y = -t * 0.4;
  });

  return (
    <group ref={groupRef}>
      <Sphere args={[0.13, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </Sphere>
      <mesh ref={gear1}>
        <torusGeometry args={[0.4, 0.05, 8, 36]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity * 0.8} />
      </mesh>
      <mesh ref={gear2}>
        <torusGeometry args={[0.3, 0.04, 8, 36]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity * 0.6} />
      </mesh>
    </group>
  );
}

// 5. Learn Node: Torus knot
function LearnNode({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ref = useRef<THREE.Mesh>(null);
  const orbiter = useRef<THREE.Group>(null);
  const color = NODES[4].color;
  const opacity = active ? 1.0 : 0.25;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.y = NODES[4].pos.y + Math.sin(t * 1.2) * 0.08;
      groupRef.current.position.z = NODES[4].pos.z + Math.cos(t * 1.5) * 0.05;
    }
    if (ref.current) {
      ref.current.rotation.z = t * 0.35;
      ref.current.rotation.x = t * 0.15;
    }
    if (orbiter.current) {
      orbiter.current.rotation.y = t * 1.0;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={ref}>
        <torusKnotGeometry args={[0.3, 0.08, 80, 8, 3, 4]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={opacity * 0.8} />
      </mesh>
      <group ref={orbiter}>
        <mesh position={[0.55, 0, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={opacity} />
        </mesh>
      </group>
    </group>
  );
}

// Animated data packet that glides along curved bezier trajectories with z-axis oscillation
function DataPacket({ start, end, delay, label, color }: { start: THREE.Vector3; end: THREE.Vector3; delay: number; label: string; color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const el = labelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nodeX = rect.left + rect.width / 2;
      const nodeY = rect.top + rect.height / 2;
      const dx = e.clientX - nodeX;
      const dy = e.clientY - nodeY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const threshold = 150;
      if (dist < threshold) {
        // Calculate offset factor: stronger when closer
        const force = (threshold - dist) / threshold;
        const maxOffset = 18; // maximum offset in pixels
        // Pull toward cursor
        const moveX = (dx / dist) * force * maxOffset;
        const moveY = (dy / dist) * force * maxOffset;
        setOffset({ x: moveX, y: moveY });
      } else {
        setOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (ref.current) {
      const speed = 0.26; // steady, elegant pace
      const rawT = ((state.clock.getElapsedTime() * speed) + delay) % 1;
      const easedT = easeInOutCubic(rawT);
      
      // Calculate straight line vector
      ref.current.position.lerpVectors(start, end, easedT);
      
      // Apply 3D curved routing
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        // Lateral curve height
        const curveHeight = 0.42;
        const offset = Math.sin(easedT * Math.PI) * curveHeight;
        
        // Perpendicular unit vector (-dy, dx)
        const perpX = -dy / len;
        const perpY = dx / len;
        
        ref.current.position.x += perpX * offset;
        ref.current.position.y += perpY * offset;
        
        // Float Z coordinates inside double wave pattern for depth
        ref.current.position.z += Math.sin(easedT * Math.PI * 2) * 0.16;
      }
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.07, 16, 16]} />
      <meshBasicMaterial color="#ffffff" />
      <Html distanceFactor={5.5} position={[0, 0.26, 0]} center>
        <div 
          ref={labelRef}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
            transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none'
          }}
        >
          <div className="flow-text-label" style={{ '--label-accent': color } as any}>
            <span className="flow-label-dot"></span>
            {label}
          </div>
        </div>
      </Html>
    </mesh>
  );
}

// Active segment highlighter with smooth breathing glow pulse
function ActiveConduitSegment({ start, end, color }: { start: THREE.Vector3; end: THREE.Vector3; color: string }) {
  const lineRef = useRef<any>(null);

  useFrame((state) => {
    if (lineRef.current?.material) {
      const t = state.clock.getElapsedTime();
      // Fast pulsing brightness representing high traffic
      lineRef.current.material.opacity = 0.5 + Math.sin(t * 7) * 0.25;
    }
  });

  return (
    <Line
      ref={lineRef}
      points={[start, end]}
      color={color}
      lineWidth={3.8}
      transparent
      opacity={0.8}
    />
  );
}

// Draw conduits and pipelines between nodes
function FlowConnections({ activeStep }: { activeStep: number | null }) {
  const points = [
    NODES[0].pos,
    NODES[1].pos,
    NODES[2].pos,
    NODES[3].pos,
    NODES[4].pos,
    NODES[0].pos
  ];

  return (
    <group>
      {/* Conduit lines */}
      <Line 
        points={points} 
        color="#ffffff" 
        lineWidth={1.0} 
        transparent 
        opacity={0.12} 
      />

      {/* Active segment highlighter */}
      {activeStep !== null && activeStep >= 0 && activeStep < NODES.length && (
        <ActiveConduitSegment 
          start={NODES[activeStep].pos}
          end={NODES[(activeStep + 1) % NODES.length].pos}
          color={NODES[activeStep].color}
        />
      )}

      {/* Telemetry labels and packets flowing along curved paths */}
      <DataPacket start={NODES[0].pos} end={NODES[1].pos} delay={0.0} label="Metrics & Logs" color={NODES[0].color} />
      <DataPacket start={NODES[1].pos} end={NODES[2].pos} delay={0.2} label="Topology Graph" color={NODES[1].color} />
      <DataPacket start={NODES[2].pos} end={NODES[3].pos} delay={0.4} label="Action Policy" color={NODES[2].color} />
      <DataPacket start={NODES[3].pos} end={NODES[4].pos} delay={0.6} label="Execution Logs" color={NODES[3].color} />
      <DataPacket start={NODES[4].pos} end={NODES[0].pos} delay={0.8} label="AI SOP updates" color={NODES[4].color} />
    </group>
  );
}

export default function FlowCanvas({ activeStep }: { activeStep: number | null }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 8.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.8} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <ObserveNode active={activeStep === 0} />
        <UnderstandNode active={activeStep === 1} />
        <DecideNode active={activeStep === 2} />
        <ActNode active={activeStep === 3} />
        <LearnNode active={activeStep === 4} />
        
        <FlowConnections activeStep={activeStep} />
        
        <SceneController activeStep={activeStep} />
      </Canvas>
    </div>
  );
}
