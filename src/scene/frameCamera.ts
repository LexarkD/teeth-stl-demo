import type { AbstractMesh, ArcRotateCamera } from "@babylonjs/core";

// Запас вокруг модели в кадре: 0.05 = камера на 5% дальше, чем нужно впритык.
const FRAME_PADDING = 0.05;

//  Ближняя плоскость отсечения — доля радиуса модели. Маленькая, чтобы при приближении камера не «срезала» модель.
const NEAR_PLANE_TO_MODEL_RADIUS = 0.01;

// Дальняя плоскость отсечения — во сколько раз дальше начального расстояния камеры.
const FAR_PLANE_TO_CAMERA_DISTANCE = 10;

// Делаю адаптивную камеру для разных экранов
// Ставит камеру на таком расстоянии, чтобы меш целиком помещался в кадр. Рассчитывает, что target камеры уже совпадает с центром меша.

export function frameCamera(camera: ArcRotateCamera, mesh: AbstractMesh): void {
  //Тип параметра — mesh: AbstractMesh: функции нужна только рамка, а она есть у любого меша.
  const modelRadius = mesh.getBoundingInfo().boundingSphere.radiusWorld;

  // Соотношение сторон области рисования камеры. Движок получаю по ссылкам,
  // которые хранятся в полях объектов: камера → сцена → движок.
  const aspect = camera.getScene().getEngine().getAspectRatio(camera);

  // camera.fov фиксирует угол по вертикали; горизонтальный зависит от формы экрана.
  // Модель должна влезть по самой узкой стороне — беру меньший угол.
  const halfFovV = camera.fov / 2; // Половина угла обзора
  const halfFovH = Math.atan(Math.tan(halfFovV) * aspect);
  //Беру меньший из двух углов (Math.min) и ставим камеру так, чтобы модель влезла по самой узкой стороне
  const halfFov = Math.min(halfFovV, halfFovH);

  // Расстояние, с которого сфера касается краёв кадра.
  const fitDistance = modelRadius / Math.sin(halfFov);
  camera.radius = fitDistance * (1 + FRAME_PADDING);

  // Плоскости отсечения: камера рисует только то, что между minZ и maxZ.
  // всё ближе minZ и дальше maxZ камера не рисует
  camera.minZ = modelRadius * NEAR_PLANE_TO_MODEL_RADIUS;
  camera.maxZ = camera.radius * FAR_PLANE_TO_CAMERA_DISTANCE;
}
