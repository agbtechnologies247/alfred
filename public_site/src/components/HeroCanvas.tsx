import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

function FloatingParticleField() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate 45 random particle coordinates
  const particles = useMemo(() => {
    const coords: THREE.Vector3[] = [];
    for (let i = 0; i < 45; i++) {
      coords.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6
        )
      );
    }
    return coords;
  }, []);

  // Determine connection lines between close particles
  const connections = useMemo(() => {
    const links: [THREE.Vector3, THREE.Vector3][] = [];
    const maxDist = 3.5;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        if (particles[i].distanceTo(particles[j]) < maxDist) {
          links.push([particles[i], particles[j]]);
        }
      }
    }
    return links;
  }, [particles]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    if (groupRef.current) {
      // Slow rotation for general drift
      groupRef.current.rotation.y = elapsed * 0.03;
      groupRef.current.rotation.x = Math.sin(elapsed * 0.02) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Draw the particles */}
      {particles.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color="#e11d48" transparent opacity={0.35} />
        </mesh>
      ))}

      {/* Draw connection lines */}
      {connections.map((line, idx) => (
        <Line 
          key={idx}
          points={[line[0], line[1]]} 
          color="#ffffff" 
          lineWidth={0.5} 
          transparent 
          opacity={0.06} 
        />
      ))}

      {/* Floating faded background shapes */}
      <group position={[-4, 2, -2]}>
        <mesh>
          <icosahedronGeometry args={[1.2, 1]} />
          <meshBasicMaterial color="#06b6d4" wireframe transparent opacity={0.05} />
        </mesh>
      </group>
      <group position={[4, -2.5, -3]}>
        <mesh>
          <dodecahedronGeometry args={[1.0]} />
          <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.05} />
        </mesh>
      </group>
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      overflow: 'hidden'
    }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={1.5} />
        <FloatingParticleField />
      </Canvas>
    </div>
  );
}
