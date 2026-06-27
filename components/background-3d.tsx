"use client";

import { Float, MeshDistortMaterial, Sparkles, Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Mesh, Vector2 as ThreeVector2Type } from "three";
import { Vector2 as ThreeVector2 } from "three";

type DressOrbitProps = {
  position: [number, number, number];
  color: string;
  accent: string;
  scale?: number;
  speed?: number;
};

function DressOrbit({
  position,
  color,
  accent,
  scale = 1,
  speed = 1,
}: DressOrbitProps) {
  const groupRef = useRef<Group>(null);

  const gownProfile = useMemo<ThreeVector2Type[]>(
    () => [
      new ThreeVector2(0.0, 1.1),
      new ThreeVector2(0.12, 0.95),
      new ThreeVector2(0.16, 0.75),
      new ThreeVector2(0.2, 0.55),
      new ThreeVector2(0.24, 0.38),
      new ThreeVector2(0.5, -0.1),
      new ThreeVector2(0.78, -0.86),
      new ThreeVector2(0.0, -0.9),
    ],
    [],
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(t * 0.75) * 0.12;
      groupRef.current.rotation.y = Math.sin(t * 0.45) * 0.4;
      groupRef.current.rotation.z = Math.cos(t * 0.35) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <Float speed={1.4} floatIntensity={0.6} rotationIntensity={0.4}>
        <mesh castShadow>
          <latheGeometry args={[gownProfile, 64]} />
          <MeshDistortMaterial
            color={color}
            roughness={0.12}
            metalness={0.36}
            distort={0.22}
            speed={1}
            emissive={color}
            emissiveIntensity={0.14}
          />
        </mesh>
      </Float>

      <mesh position={[0, 0.16, 0]}>
        <torusGeometry args={[0.24, 0.032, 16, 120]} />
        <meshStandardMaterial color={accent} roughness={0.2} metalness={0.85} />
      </mesh>

      <mesh position={[0, 1.22, 0]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.32, 0.018, 12, 100, Math.PI]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 1.36, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.2, 12]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

type CoutureRibbonProps = {
  position: [number, number, number];
  color: string;
  speed?: number;
  scale?: number;
};

function CoutureRibbon({ position, color, speed = 1, scale = 1 }: CoutureRibbonProps) {
  const ribbonRef = useRef<Mesh>(null);

  useFrame((state) => {
    if (!ribbonRef.current) {
      return;
    }
    const t = state.clock.getElapsedTime() * speed;
    ribbonRef.current.rotation.x = Math.sin(t * 0.35) * 0.2;
    ribbonRef.current.rotation.y = t * 0.38;
    ribbonRef.current.rotation.z = Math.cos(t * 0.42) * 0.4;
  });

  return (
    <mesh ref={ribbonRef} position={position} scale={scale}>
      <torusKnotGeometry args={[0.66, 0.12, 220, 24]} />
      <MeshDistortMaterial
        color={color}
        roughness={0.22}
        metalness={0.62}
        distort={0.36}
        speed={0.9}
        transparent
        opacity={0.36}
      />
    </mesh>
  );
}

function RunwayHalo() {
  const haloRef = useRef<Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.2;
    }
  });

  return (
    <>
      <mesh ref={haloRef} position={[0, -1.95, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.95, 2.9, 84]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.25} />
      </mesh>
      <mesh position={[0, -2.02, -0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.02, 3.65, 84]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.16} />
      </mesh>
    </>
  );
}

function CameraDrift() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    state.camera.position.x = state.mouse.x * 0.48 + Math.sin(t * 0.2) * 0.18;
    state.camera.position.y = state.mouse.y * 0.34 + Math.cos(t * 0.17) * 0.12;
    state.camera.lookAt(0, 0, -0.7);
  });

  return null;
}

function FashionScene() {
  return (
    <group>
      <fog attach="fog" args={["#020617", 6, 18]} />
      <CameraDrift />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 3]} intensity={1.4} color="#f9a8d4" />
      <pointLight position={[-4, 1, 2]} intensity={1.2} color="#22d3ee" />
      <pointLight position={[4, -1, 2]} intensity={0.8} color="#a78bfa" />
      <pointLight position={[0, 3, -2]} intensity={0.5} color="#38bdf8" />

      <RunwayHalo />
      <CoutureRibbon position={[-3.1, 1.2, -2.8]} color="#22d3ee" speed={0.7} scale={0.78} />
      <CoutureRibbon position={[3.2, 1.1, -2.5]} color="#f472b6" speed={0.86} scale={0.72} />
      <CoutureRibbon position={[0, -0.6, -3.2]} color="#a78bfa" speed={0.6} scale={1.2} />

      <DressOrbit
        position={[-2.3, 0.25, -1.4]}
        color="#f472b6"
        accent="#f9a8d4"
        speed={1.05}
      />
      <DressOrbit
        position={[0, 0.5, -0.25]}
        color="#38bdf8"
        accent="#67e8f9"
        scale={1.08}
        speed={0.9}
      />
      <DressOrbit
        position={[2.4, 0.2, -1.3]}
        color="#c084fc"
        accent="#ddd6fe"
        speed={1.2}
      />

      <mesh position={[0, -2.1, -0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 4.6]} />
        <meshStandardMaterial color="#1e1b4b" transparent opacity={0.18} metalness={0.38} />
      </mesh>

      <Stars radius={70} depth={30} count={1800} factor={2.2} saturation={0.1} fade speed={0.35} />
      <Sparkles
        count={320}
        speed={0.45}
        opacity={0.65}
        color="#f8fafc"
        size={2.2}
        scale={[15, 8, 8]}
      />
    </group>
  );
}

export function Background3D() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_84%_10%,rgba(244,114,182,0.16),transparent_34%),radial-gradient(circle_at_48%_84%,rgba(167,139,250,0.2),transparent_46%)]" />
      <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0.2, 7.2], fov: 54 }}>
        <FashionScene />
      </Canvas>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(2,6,23,0.4),rgba(2,6,23,0.72)_45%,rgba(2,6,23,0.84))]" />
    </div>
  );
}
