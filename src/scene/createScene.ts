import {
  ArcRotateCamera,
  Color3,
  Color4,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3,
  type AbstractEngine,
} from "@babylonjs/core";

// Создаю сцену, у неё своё пространство "мир". Добавляю в сцену камеру, свет и объект.
// У объекта (box) есть геометрия (форма), материал и трансформация: position, rotation, scaling.
export function createScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  // Цвет фона кадра
  scene.clearColor = new Color4(0.09, 0.09, 0.11, 1);

  // Камера «на орбите»: движется по сфере радиусом radius, центр сферы — target. Камера всегда смотрит в центр.
  // Углы — в радианах (Math.PI = 180°).
  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2, // alpha — угол по горизонтали (влево-вправо). Здесь: смотрим спереди
    Math.PI / 3, // beta — угол от верхнего полюса: 0 — сверху, π/2 — сбоку. Здесь: чуть сверху
    8, // radius - расстояние от камеры до центра(target)
    // Vector3 - Класс, используемый для хранения векторного представления (x, y, z) - точка в пространстве или направление.
    new Vector3(0, 0, 0), //target - точка, вокруг которой вращается камера.
    scene
  );
  camera.attachControl(); // мышь/тач управляют камерой; канвас берётся из engine

  // Свет «небо/земля». вектор (0, 1, 0) указывает, где небо, (свет сверху)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  light.intensity = 0.9; // яркость, по умолчанию 1

  // Создаю меш — это объект сцены с геометрией, трансформацией и материалом.
  // Последний аргумент scene — меш сразу попадает в эту сцену.
  const box = MeshBuilder.CreateBox(
    "box",
    { width: 1, height: 1, depth: 1 }, // размеры в единицах мира, условная величина без физического смысла.
    scene
  );

  // Трансформация считается относительно родителя; родителя нет — значит, относительно мира.
  // Свойства заданы для наглядности. Значения равны значениям по умолчанию
  box.position = new Vector3(0, 0, 0);
  box.rotation = new Vector3(0, 0, 0);
  box.scaling = new Vector3(1, 1, 1);

  const material = new StandardMaterial("boxMaterial", scene);
  //   material.wireframe = true; // показать сетку

  // Основной цвет поверхности
  material.diffuseColor = new Color3(0.92, 0.9, 0.84);
  box.material = material;

  // onBeforeRenderObservable — событие перед отрисовкой каждого кадра
  // (сразу после анимаций и физики). add(...) подписывает на него функцию.
  scene.onBeforeRenderObservable.add(() => {
    // каждый кадр поворачиваю box вокруг оси Y на 0.01 рад.
    // Ось проходит через опорную точку (pivot); у CreateBox она в центре — поэтому крутится на месте.
    // getAnimationRatio() выравнивает скорость (на 30 и на 120 Гц вращение одинаковое)
    box.rotation.y += 0.01 * scene.getAnimationRatio();
  });

  return scene;
}
