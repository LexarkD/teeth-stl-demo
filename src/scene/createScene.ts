import {
  ArcRotateCamera,
  Color3,
  Color4,
  HemisphericLight,
  PointLight,
  Scene,
  Vector3,
  AxesViewer,
  ArcRotateCameraPointersInput,
  type AbstractEngine,
} from "@babylonjs/core";
import { loadTeethModel } from "./loadTeethModel";
import { frameCamera } from "./frameCamera";
import { enableNaturalPanning } from "./naturalPanning";

const SHOW_AXES = true; // Показать оси (X — красная, Y — зелёная, Z — синяя)

export function createScene(engine: AbstractEngine): Scene {
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.09, 0.09, 0.11, 1);

  const camera = new ArcRotateCamera(
    "camera",
    -Math.PI / 2, // смотрим спереди: камера стоит на стороне -Z
    Math.PI / 3, // чуть сверху
    10, //  radius = 10 временный: настоящее расстояние посчитает frameCamera, когда станет известен размер модели
    new Vector3(0, 0, 0),
    scene
  );
  camera.attachControl();

  // Колесо мыши меняет расстояние на 1% от текущего, а не на фиксированную величину.
  // Без этого при модели в миллиметрах один щелчок колеса двигал бы камеру меньше чем на 1 мм.
  camera.wheelDeltaPercentage = 0.01;
  // Естественный зум щипком
  camera.useNaturalPinchZoom = true;
  // Сдвиг с пальцем 1:1
  enableNaturalPanning(camera);

  // Настройка жеста двумя пальцами —  либо режим сдвиг, либо режим зум. Иначе -ложные срабатывания на сенсорном экране
  const pointers = camera.inputs.attached["pointers"];
  if (pointers instanceof ArcRotateCameraPointersInput) {
    pointers.multiTouchPanAndZoom = false;
  }
  // Порог «сдвиг или зум»: на сколько пикселей должно измениться расстояние между пальцами
  // за одно событие касания в начале жеста, чтобы включился зум. По умолчанию 20
  camera.pinchToPanMaxDistance = 8;

  // Заполняющий свет «небо/земля»: сверху светлее, снизу groundColor,
  // чтобы нижняя сторона модели не была чёрной. Бликов от него не нужно.
  const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
  ambient.intensity = 0.5;
  ambient.groundColor = new Color3(0.3, 0.3, 0.32);
  ambient.specular = Color3.Black();

  // Точечный свет привязан к камере
  // position (0,0,0) считается относительно родителя, то есть свет всегда в камере
  // освещает ту сторону модели, на которую мы смотрим. Дает блик
  const headlight = new PointLight("headlight", new Vector3(0, 0, 0), scene);
  headlight.parent = camera;
  headlight.intensity = 0.6;

  // Загрузка асинхронная: сцена возвращается сразу, модель появится, когда скачается.
  // void — явно говорим «промис не ждём»; ошибки ловятся внутри showTeethModel.
  void showTeethModel(scene, camera);
  return scene;
}

// Дожидается модели и настраивает под неё сцену.
async function showTeethModel(
  scene: Scene,
  camera: ArcRotateCamera
): Promise<void> {
  try {
    const teeth = await loadTeethModel(scene);
    if (!teeth) return; // сцену уничтожили, пока модель грузилась

    frameCamera(camera, teeth);

    if (SHOW_AXES) {
      new AxesViewer(scene, teeth.getBoundingInfo().boundingSphere.radiusWorld);
    }

    // ОШИБКИ ЛОВЯТСЯ ТУТ:
    // когда файл загрузился, но меша в нём нет
    // ошибка импорта модели (ImportMeshAsync)
  } catch (error) {
    if (scene.isDisposed) return; // ошибка из-за уничтоженной сцены ожидаема
    console.error("[teeth] не удалось загрузить модель:", error); //пока что просто пишу в консоль, позже можно показать сообщение на экране
  }
}
