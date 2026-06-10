import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import wrenchUrl from "./Model/wrench.glb";

export type HowScene = {
  render: () => void;
  resize: () => void;
  dispose: () => void;
};

function fitModelToView(model: THREE.Object3D, targetSize = 2.2) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;

  model.position.sub(center);
  model.scale.setScalar(targetSize / maxDim);
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];
    materials.forEach((material) => material.dispose());
  });
}

export function createHowScene(canvas: HTMLCanvasElement): HowScene {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.2, 4);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
  keyLight.position.set(3, 4, 5);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xffd6a8, 0.6);
  fillLight.position.set(-3, 1, 2);
  scene.add(fillLight);

  let model: THREE.Object3D | null = null;
  const loader = new GLTFLoader();

  loader.load(
    wrenchUrl,
    (gltf) => {
      model = gltf.scene;
      fitModelToView(model);
      scene.add(model);
    },
    undefined,
    (error) => {
      console.error("Failed to load wrench model:", error);
    },
  );

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };

  const render = () => {
    if (model) {
      model.rotation.y += 0.008;
    }
    renderer.render(scene, camera);
  };

  resize();

  return {
    render,
    resize,
    dispose: () => {
      if (model) {
        scene.remove(model);
        disposeObject(model);
      }
      renderer.dispose();
    },
  };
}
