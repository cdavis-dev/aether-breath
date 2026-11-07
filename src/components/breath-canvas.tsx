import { Canvas, useFrame } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import type { BreathEngine } from "@/lib/breath/engine";
import { breathAudio } from "@/lib/audio/breath-audio";
import { createTorusCloud } from "@/lib/scene/torus-cloud";
import * as THREE from "three";

function Scene({ engine }: { engine: BreathEngine }) {
  const cloud = useMemo(() => createTorusCloud(), []);
  const look = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const camTime = useRef(0);

  useEffect(() => {
    return () => cloud.dispose();
  }, [cloud]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const snap = engine.tick(dt);
    const pr = state.gl.getPixelRatio();
    cloud.update(dt, snap, pr);
    breathAudio.setMotion(snap.expansion, snap.speed);

    if (!snap.paused) camTime.current += dt;
    const t = camTime.current;
    const cam = state.camera;
    cam.position.x = Math.sin(t * 0.07) * 0.28;
    cam.position.y = 0.22 + Math.sin(t * 0.11) * 0.1;
    cam.position.z = 5.7 + snap.expansion * 0.85;
    cam.lookAt(look);
  });

  return <primitive object={cloud.group} />;
}

export const BreathCanvas = memo(function BreathCanvas({
  engine,
}: {
  engine: BreathEngine;
}) {
  return (
    <div className="absolute inset-0 touch-none">
      <Canvas
        flat
        dpr={[1, 1.75]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        camera={{ fov: 38, position: [0, 0.22, 5.7], near: 0.1, far: 40 }}
        onCreated={({ gl }) => {
          gl.setClearColor("#070809", 1);
        }}
      >
        <color attach="background" args={["#070809"]} />
        <Scene engine={engine} />
      </Canvas>
    </div>
  );
});
