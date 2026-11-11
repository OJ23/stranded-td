import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeMovementScene({ room, exits, direction, moving, deck, targetRoomId, collected, onSignPositions }) {
  const mountRef = useRef(null);
  const movementRef = useRef({ direction, moving });
  movementRef.current = { direction, moving };

  useEffect(() => {
    if (typeof WebGLRenderingContext === "undefined") return undefined;
    const mount = mountRef.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false }); }
    catch { return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x06121b);
    scene.fog = new THREE.Fog(0x06121b, 13, 30);
    const camera = new THREE.PerspectiveCamera(63, 1, 0.1, 50);
    camera.position.set(0, 2.35, 7.5);
    camera.lookAt(0, 1.55, -3);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [];
    const addBox = (parent, x, y, z, w, h, d, color, glow = 0) => {
      const material = new THREE.MeshStandardMaterial({ color, emissive: glow, emissiveIntensity: 0.7, roughness: 0.75 });
      materials.push(material);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.scale.set(w, h, d);
      parent.add(mesh);
      return mesh;
    };
    const sideRoom = Boolean(room.type);
    const accent = room.type === "hazard" ? 0xa94b37 : room.type === "survivor" ? 0x56a5a4 : room.type === "traitor" ? 0x9c654d : 0x8dab4b;
    const depth = sideRoom ? 9 : 19;
    const center = sideRoom ? -1 : -2;
    addBox(scene, 0, -0.12, center, 6, 0.24, depth, sideRoom ? 0x263138 : 0x172b36);
    addBox(scene, 0, 3.55, center, 6, 0.22, depth, 0x101c28);
    for (const side of [-1, 1]) {
      addBox(scene, side * 3, 1.7, center, 0.2, 3.5, depth, 0x182b36);
      for (let z = sideRoom ? -4 : -10; z <= (sideRoom ? 2 : 6); z += 2) {
        addBox(scene, side * 2.82, 1.7, z, 0.22, 3.4, 0.2, 0x345365);
        addBox(scene, side * 2.66, 3.05, z, 0.06, 0.28, 0.16, 0x9b382f, 0x9b382f);
        addBox(scene, side * 2.72, 0.3, z, 0.07, 0.07, 1.5, 0x31566a);
      }
    }
    for (let z = sideRoom ? -4 : -10; z <= (sideRoom ? 2 : 6); z += 2) {
      addBox(scene, 0, 3.35, z, 1.3, 0.05, 0.14, 0x8ccad4, 0x397f91);
      addBox(scene, 0, 0.02, z, 0.07, 0.03, 1.2, 0x426b78, 0x245064);
      addBox(scene, 0, 3.38, z, 5.8, 0.12, 0.13, 0x35505d);
      addBox(scene, 0, 0.025, z, 5.6, 0.025, 0.055, 0x415b66);
    }
    const back = sideRoom ? -5.45 : -11.4;
    addBox(scene, 0, 1.65, back, 5.7, 3.3, 0.3, 0x27383e);
    if (sideRoom) {
      if (["scanner", "battery", "oxygen"].includes(room.type)) {
        for (const x of [-1.7, 1.7]) for (const y of [0.55, 1.5, 2.45]) addBox(scene, x, y, -4.3, 1.15, 0.12, 0.7, 0x52616a);
        if (!collected) {
          // A wall-mounted supply case holds the room's pickup until collected.
          addBox(scene, 0, 1.58, -5.06, 1.35, 1.15, 0.38, 0x526b78);
          addBox(scene, 0, 1.58, -4.84, 1.13, 0.94, 0.12, 0x07151c);
          addBox(scene, 0, 2.16, -4.82, 1.4, 0.08, 0.16, accent, accent);
          addBox(scene, 0, 1.01, -4.82, 1.4, 0.08, 0.16, 0x315769);
          if (room.type === "scanner") {
            addBox(scene, 0, 1.57, -4.72, 0.68, 0.38, 0.18, 0x829fa3);
            addBox(scene, 0, 1.63, -4.61, 0.38, 0.18, 0.05, 0x79dfe4, 0x4cb6bf);
            addBox(scene, 0.39, 1.27, -4.68, 0.1, 0.32, 0.1, 0xe1bb70);
          } else if (room.type === "battery") {
            addBox(scene, 0, 1.57, -4.7, 0.52, 0.68, 0.22, 0x718b38);
            addBox(scene, 0, 1.94, -4.69, 0.28, 0.08, 0.16, 0xcaff76, 0x9bcf49);
          } else {
            addBox(scene, 0, 1.56, -4.69, 0.42, 0.68, 0.24, 0x7db4bc);
            addBox(scene, 0, 1.95, -4.69, 0.25, 0.09, 0.15, 0xd9f6f8);
          }
        }
      } else if (["survivor", "traitor"].includes(room.type)) {
        addBox(scene, 1.7, 0.7, -3.7, 1.5, 0.7, 1.8, 0x475660);
        addBox(scene, -1.15, 0.9, -3.5, 0.55, 1.5, 0.4, accent);
        addBox(scene, -1.15, 1.9, -3.5, 0.42, 0.4, 0.4, 0xc5b7a4);
      } else {
        addBox(scene, 0, 1.5, back + 0.2, 2.7, 2.8, 0.1, 0x020509);
        addBox(scene, 0, 2.9, back + 0.3, 2.9, 0.1, 0.1, accent, accent);
      }
    } else {
      addBox(scene, 0, 1.52, -11.18, 2.3, 2.8, 0.12, 0x071216);
      addBox(scene, 0, 2.95, -11.05, 2.7, 0.12, 0.1, 0x9cc769, 0x7ca640);
      exits.forEach((exit) => {
        const side = exit.direction === "left" ? -1 : 1;
        const sideIndex = exits.filter((other) => other.direction === exit.direction).findIndex((other) => other.id === exit.id);
        const z = sideIndex === 0 ? 1.8 : -4;
        const active = targetRoomId === exit.id;
        const frame = active ? 0xb2dcca : exit.scanned ? 0x70bac4 : 0x557488;
        const scanGlow = exit.scanned ? 0x397e89 : 0;
        // A recessed hatch, with the sign mounted on its corridor-side post.
        addBox(scene, side * 2.86, 1.45, z, 0.16, 2.65, 1.9, 0x07141d);
        addBox(scene, side * 2.73, 1.45, z, 0.07, 2.45, 1.45, active ? 0x1d5264 : 0x243a48);
        addBox(scene, side * 2.66, 1.45, z, 0.04, 2.24, 0.05, 0x071820);
        for (const edge of [-1, 1]) addBox(scene, side * 2.58, 1.45, z + edge * 0.91, 0.45, 2.8, 0.16, frame, scanGlow);
        addBox(scene, side * 2.58, 2.89, z, 0.45, 0.18, 1.98, frame, scanGlow);
        addBox(scene, side * 2.53, 2.98, z, 0.13, 0.16, 1.35, active ? 0xffb66a : 0xb54936, active ? 0xff8b38 : 0x9b382f);
        addBox(scene, side * 2.46, 1.55, z + 1.03, 0.12, 0.46, 0.36, active ? 0xffad56 : 0x6c9ca5, active ? 0xff8b38 : 0x315d69);
        // The sign post stands inside the passage, ahead of the wall hatch.
        addBox(scene, side * 2.04, 1.53, z + 1.12, 0.22, 3.06, 0.24, frame);
        addBox(scene, side * 2.04, 0.12, z + 1.12, 0.48, 0.24, 0.5, 0x263d4b);
        addBox(scene, side * 2.4, 2.82, z + 1.12, 0.72, 0.13, 0.22, frame);
        addBox(scene, side * 2.04, 2.16, z + 1.25, 0.45, 0.48, 0.08, 0x091a24);
        if (exit.scanned) {
          const scanLight = new THREE.PointLight(0x6bdce5, 5, 3.5);
          scanLight.position.set(side * 2.15, 2.05, z + 0.85);
          scene.add(scanLight);
        }
      });
    }
    const player = new THREE.Group();
    scene.add(player);
    addBox(player, 0, 0.94, 0, 0.55, 0.9, 0.34, 0x8da849, 0x2e4215);
    addBox(player, 0, 1.58, 0, 0.4, 0.42, 0.38, 0xd7ff85, 0x729733);
    const legLeft = addBox(player, -0.15, 0.3, 0, 0.18, 0.52, 0.22, 0x526b43);
    const legRight = addBox(player, 0.15, 0.3, 0, 0.18, 0.52, 0.22, 0x526b43);
    const armLeft = addBox(player, -0.38, 0.95, 0, 0.16, 0.65, 0.2, 0x748d44);
    const armRight = addBox(player, 0.38, 0.95, 0, 0.16, 0.65, 0.2, 0x748d44);
    scene.add(new THREE.AmbientLight(0x79979c, 1.1));
    const light = new THREE.PointLight(room.type === "hazard" || deck === 3 ? 0xffa77a : 0x66c5dd, 38, 19);
    light.position.set(0, 3, -3);
    scene.add(light);
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (!sideRoom) {
        const positions = {};
        for (const exit of exits) {
          const side = exit.direction === "left" ? -1 : 1;
          const sideIndex = exits.filter((other) => other.direction === exit.direction).findIndex((other) => other.id === exit.id);
          const z = sideIndex === 0 ? 1.8 : -4;
          const point = new THREE.Vector3(side * 2.04, 2.16, z + 1.25).project(camera);
          positions[exit.id] = { left: `${(point.x + 1) * 50}%`, top: `${(1 - point.y) * 50}%` };
        }
        onSignPositions(positions);
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    let frame;
    let start = performance.now();
    let lastMoving = false;
    const animate = (now) => {
      frame = requestAnimationFrame(animate);
      const { direction: currentDirection, moving: currentMoving } = movementRef.current;
      if (currentMoving && !lastMoving) start = now;
      lastMoving = currentMoving;
      const progress = currentMoving ? Math.min((now - start) / (currentDirection === "left" || currentDirection === "right" ? 900 : 650), 1) : 0;
      player.position.x = currentDirection === "left" ? -2.45 * progress : currentDirection === "right" ? 2.45 * progress : 0;
      const target = exits.find((exit) => exit.id === targetRoomId);
      const targetIndex = target ? exits.filter((exit) => exit.direction === target.direction).findIndex((exit) => exit.id === target.id) : 0;
      player.position.z = currentDirection === "left" || currentDirection === "right" ? (targetIndex === 0 ? 1.8 : -4) * progress : currentDirection === "forward" ? -3.2 * progress : currentDirection === "backward" ? 2.2 * progress : 0;
      player.rotation.y = currentDirection === "left" ? -Math.PI / 2 : currentDirection === "right" ? Math.PI / 2 : currentDirection === "backward" ? Math.PI : 0;
      const stride = currentMoving ? Math.sin(now * 0.025) * 0.35 : 0;
      legLeft.rotation.x = stride; legRight.rotation.x = -stride;
      armLeft.rotation.x = -stride; armRight.rotation.x = stride;
      player.position.y = currentMoving ? Math.abs(Math.sin(now * 0.025)) * 0.05 : 0;
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      geometry.dispose();
      materials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [room.id, room.type, deck, targetRoomId, collected, exits.map((exit) => `${exit.id}:${exit.scanned}`).join(",")]);
  return <div ref={mountRef} className="movement-stage__three" aria-hidden="true" />;
}
