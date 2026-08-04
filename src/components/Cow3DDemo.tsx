"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const MODEL_URL = "/models/genlix-cow-rigged.glb";

type RiggedCowProps = {
  onReady: () => void;
  reducedMotion: boolean;
};

function RiggedCow({ onReady, reducedMotion }: RiggedCowProps) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const rootRef = useRef<THREE.Group>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    gltf.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = true;

      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

      materials.forEach((material) => {
        if (!(material instanceof THREE.MeshStandardMaterial)) return;
        material.envMapIntensity = 0.72;
        material.roughness = Math.max(material.roughness, 0.52);
        material.needsUpdate = true;
      });
    });

    const mixer = new THREE.AnimationMixer(gltf.scene);
    mixerRef.current = mixer;

    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
      action.clampWhenFinished = false;
      action.enabled = true;
      action.play();
    });

    onReady();

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
      mixerRef.current = null;
    };
  }, [gltf, onReady]);

  useFrame(({ clock, pointer }, delta) => {
    mixerRef.current?.update(reducedMotion ? 0 : delta);

    if (!rootRef.current) return;

    const rotationEase = 1 - Math.exp(-delta * 3.4);
    const idleTurn = reducedMotion ? 0 : clock.elapsedTime * 0.2;
    const targetYaw = idleTurn + pointer.x * 0.65;
    const targetPitch = pointer.y * 0.028;

    rootRef.current.rotation.y = THREE.MathUtils.lerp(
      rootRef.current.rotation.y,
      targetYaw,
      rotationEase,
    );
    rootRef.current.rotation.x = THREE.MathUtils.lerp(
      rootRef.current.rotation.x,
      targetPitch,
      rotationEase,
    );

    if (!reducedMotion) {
      rootRef.current.position.y =
        2.04 + Math.sin(clock.elapsedTime * 1.35) * 0.012;
    }
  });

  return (
    <group
      ref={rootRef}
      position={[0, 2.04, 0]}
      rotation={[0, 0, 0]}
      scale={3.3}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

function Scene({
  onReady,
  reducedMotion,
}: {
  onReady: () => void;
  reducedMotion: boolean;
}) {
  return (
    <>
      <ambientLight intensity={1.16} />
      <hemisphereLight args={["#ffffff", "#ccd7e8", 1.55]} />
      <directionalLight
        castShadow
        color="#fff8f0"
        intensity={3.8}
        position={[-4.5, 8.5, -6.5]}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={28}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-3}
        shadow-bias={-0.00012}
      />
      <directionalLight color="#ff5c63" intensity={0.34} position={[5, 3, 5]} />
      <directionalLight color="#8db7ff" intensity={0.42} position={[-5, 4, 4]} />

      <Suspense fallback={null}>
        <RiggedCow onReady={onReady} reducedMotion={reducedMotion} />
      </Suspense>

      <mesh receiveShadow position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 16]} />
        <shadowMaterial color="#092149" opacity={0.18} />
      </mesh>
    </>
  );
}

export default function Cow3DDemo() {
  const [isReady, setIsReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const handleReady = useCallback(() => setIsReady(true), []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return (
    <section className="cow-3d-demo">
      <header className="cow-3d-heading">
        <div>
          <p className="demo-kicker">RIGGED GLB · BLENDER + THREE.JS</p>
          <h2>Анатомия в объёме</h2>
        </div>
        <p>
          Настоящая модель из Blender: голова поворачивается, хвост движется,
          глаза моргают. Курсор мягко меняет ракурс.
        </p>
      </header>

      <div
        className={`cow-3d-stage ${isReady ? "is-ready" : ""}`}
        aria-label="Интерактивная трёхмерная анатомическая корова"
      >
        <Canvas
          shadows="basic"
          dpr={[1, 1.6]}
          camera={{ position: [9.2, 3.75, 6.3], fov: 34, near: 0.1, far: 60 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ camera, gl, size }) => {
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.03;

            if (camera instanceof THREE.PerspectiveCamera && size.width < 600) {
              camera.position.set(11.4, 4.15, 7.4);
              camera.fov = 42;
              camera.updateProjectionMatrix();
            }

            camera.lookAt(0, 1.75, 0);
          }}
        >
          <Scene onReady={handleReady} reducedMotion={reducedMotion} />
        </Canvas>

        <span className="cow-3d-loading" aria-hidden="true">
          ЗАГРУЖАЕМ GLB-МОДЕЛЬ
        </span>
        <span className="cow-3d-cursor-hint" aria-hidden="true">
          AUTO ROTATION · MOVE CURSOR
        </span>
      </div>

      <footer className="cow-3d-status" aria-label="Активные функции модели">
        <span><i /> Blender rig</span>
        <span><i /> Head motion</span>
        <span><i /> Tail animation</span>
        <span><i /> Natural blink</span>
      </footer>
    </section>
  );
}

useLoader.preload(GLTFLoader, MODEL_URL);
