import type { AbstractMesh, ArcRotateCamera } from "@babylonjs/core";

// Запас вокруг модели в кадре: 0.05 = камера на 5% дальше, чем нужно впритык.
const FRAME_PADDING = 0.05;

//  Ближняя плоскость отсечения — доля радиуса модели. Маленькая, чтобы при приближении камера не «срезала» модель.
const NEAR_PLANE_TO_MODEL_RADIUS = 0.01;

// Дальняя плоскость отсечения — во сколько раз дальше начального расстояния камеры.
// Должна быть больше MAX_DISTANCE_TO_START_DISTANCE + 1, иначе при максимальном отдалении дальняя сторона модели обрежется.
const FAR_PLANE_TO_CAMERA_DISTANCE = 10;

// Ограничения зума
// Ближе этого камера войдёт внутрь модели. Изнутри стенки не рисуются
const MIN_DISTANCE_TO_MODEL_RADIUS = 0.7;
// Во сколько раз можно отдалиться от стартового расстояния. Больше- нет смысла
const MAX_DISTANCE_TO_START_DISTANCE = 3;

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
  //Беру меньший из двух углов (Math.min) и ставлю камеру так, чтобы модель влезла по самой узкой стороне
  const halfFov = Math.min(halfFovV, halfFovH);

  // Расстояние, с которого сфера касается краёв кадра.
  const fitDistance = modelRadius / Math.sin(halfFov);
  camera.radius = fitDistance * (1 + FRAME_PADDING);

  // Пределы для camera.radius. Babylon проверяет их каждый кадр, при любом вводе:
  // колесо, щипок или код.
  camera.lowerRadiusLimit = modelRadius * MIN_DISTANCE_TO_MODEL_RADIUS;
  camera.upperRadiusLimit = camera.radius * MAX_DISTANCE_TO_START_DISTANCE;
  // Центр вращения можно увести от центра модели не дальше её радиуса.
  // Расстояние считается от camera.panningOriginTarget — по умолчанию (0,0,0),
  // а центр модели там благодаря placeAtOrigin в loadTeethModel.
  camera.panningDistanceLimit = modelRadius;

  // Плоскости отсечения: камера рисует только то, что между minZ и maxZ.
  // всё ближе minZ и дальше maxZ камера не рисует
  camera.minZ = modelRadius * NEAR_PLANE_TO_MODEL_RADIUS;
  camera.maxZ = camera.radius * FAR_PLANE_TO_CAMERA_DISTANCE;
}
