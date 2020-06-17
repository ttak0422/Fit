import * as THREE from "three";
import { EntryButton } from "./lib/entry-button";
import { BoxHelper } from "three";

//// three ////
// 必須要素
let renderer: THREE.WebGLRenderer;
let camera: THREE.Camera;
let light: THREE.DirectionalLight;
let scene: THREE.Scene;

// シーンで利用するオブジェクト
let reticle: THREE.Group;
let fitObject: THREE.Mesh; //THREE.BoxHelper;
let objects = [];
const MAX_OBJ = 3;

// 再利用用
let cameraPosition = new THREE.Vector3();
let cameraQuaternion = new THREE.Quaternion();
let cameraScale = new THREE.Vector3();
let objectSize = new THREE.Vector3(0.2, 0.1, 0.1); // 縦・横・高さ

//// xr session ////
const _navigator: any = navigator;

let xrSession: any;
let xrRefSpace: any;
let xrViewerSpace: any;
let xrHitTestSource: any;

// overlay
let overlayElement = document.createElement("div");
overlayElement.id = "overlay";
overlayElement.style.display = "none";
overlayElement.innerHTML = `
<button id="generate-button">spawn</button>
`;

function start(): void {
  // threejsの必須要素の初期化
  renderer = new THREE.WebGLRenderer({
    antialias: false,
    alpha: true,
  });
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  light = new THREE.DirectionalLight(0xffffff, 0.7);
  light.position.set(1, 1, 1).normalize();
  scene = new THREE.Scene();

  // reticle
  // 1x1で作成してscaleを変化させる。
  const reticleGeometry = new THREE.PlaneGeometry(1, 1, 1, 1);
  const reticleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, // TODO
    transparent: true,
    opacity: 0.7,
  });
  const reticleMesh = new THREE.Mesh(reticleGeometry, reticleMaterial);
  reticleMesh.rotation.set(-Math.PI / 2, 0, 0);
  reticle = new THREE.Group();
  reticle.add(reticleMesh);
  reticle.visible = false;
  reticle.scale.set(objectSize.x, 1, objectSize.y);
  scene.add(reticle);

  // fitObject
  // reticleと同様にscaleを変化させる。
  const fitGeometry = new THREE.BoxGeometry(1, 1, 1);
  const fitMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, // TODO
    transparent: true,
    opacity: 0.7,
  });
  const fitMesh = new THREE.Mesh(fitGeometry, fitMaterial);
  fitObject = fitMesh; //new THREE.BoxHelper(fitMesh, 0xffffff);
}

function update(): void {
  // カメラ座標の取得用変数の更新
  camera.matrixWorld.decompose(cameraPosition, cameraQuaternion, cameraScale);
  // webxr api関連
  // 接地判定を行い、その結果を元に更新処理を行う。
  xrSession.requestAnimationFrame((time, frame) => {
    const pose = frame.getViewerPose(xrRefSpace);
    reticle.visible = false;
    if (xrHitTestSource && pose) {
      const hitTestResults = frame.getHitTestResults(xrHitTestSource);
      if (hitTestResults.length > 0) {
        reticle.visible = true;
        const pose = hitTestResults[0].getPose(xrRefSpace);
        const position = pose.transform.position;
        // recicleの位置を更新
        reticle.position.set(position.x, position.y, position.z);
        // reticleの向きを更新
        reticle.lookAt(cameraPosition.x, reticle.position.y, cameraPosition.z);
      }
    }
  });
  // threeの描画
  renderer.render(scene, camera);
}

function onRequestSession(): void {
  console.log("onRequest1111");
  _navigator.xr
    .requestSession("immersive-ar", {
      requiredFeatures: ["local", "hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.getElementById("overlay") },
    })
    .then(onStartSession); // TODO: onRequestSessionError...
}

function spawnFitObject() {
  console.log("spawn");
  if (reticle.visible) {
    let obj = fitObject.clone();
    obj.scale.set(
      objectSize.x,
      objectSize.y,
      objectSize.z
    );
    obj.position.set(
      reticle.position.x,
      reticle.position.y,
      reticle.position.z
    );
    obj.lookAt(cameraPosition.x, reticle.position.y, cameraPosition.z);
    objects.push(obj);
    scene.add(obj);
    if(objects.length > MAX_OBJ) {
        let o = objects.shift();
        scene.remove(o);
    }
  }
}

function onStartSession(session: any): void {
  // overlay
  overlayElement.style.display = "block";
  // three
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  renderer.xr.setSession(session);
  // session
  xrSession = session;
  xrSession.requestReferenceSpace("viewer").then((refSpace: any) => {
    xrViewerSpace = refSpace;
    xrSession
      .requestHitTestSource({ space: xrViewerSpace })
      .then((hitTestSource: any) => {
        xrHitTestSource = hitTestSource;
      });
  });
  xrSession.requestReferenceSpace("local").then((refSpace: any) => {
    xrRefSpace = refSpace;
    renderer.setAnimationLoop(update);
  });
}

// entry point
start();
const entryButton = new EntryButton({ onRequestSession });
window.onload = () => {
  console.log("1111");
  document.body.appendChild(entryButton);
  document.body.appendChild(overlayElement);
  document
    .getElementById("generate-button")
    .addEventListener("click", spawnFitObject);
  document
    .getElementById("generate-button")
    .setAttribute(
      "style",
      "width: 50%; height: 10%; position: absolute; left: 25%; bottom: 5%;"
    );
};
