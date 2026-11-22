// Регистрирует загрузчик STL. Импорт «ради побочного эффекта. Нужен, чтоб ImportMeshAsync понимал .stl
import "@babylonjs/loaders/STL";

import {
  Color3,
  ImportMeshAsync,
  Mesh,
  StandardMaterial,
  Vector3,
  type Scene,
} from "@babylonjs/core";

const MODEL_URL = "/models/teeth.stl";
// Доворот на 180° вокруг Y, чтобы резцы смотрели в камеру
const MODEL_ROTATION = new Vector3(0, Math.PI, 0);

// Загружает модель зубов, ставит её в стандартную позу и назначает материал.
// Возвращает null, если сцену уничтожили во время загрузки.
// Ошибку загрузки не ловит: что с ней делать, решает вызывающий код.

export async function loadTeethModel(scene: Scene): Promise<Mesh | null> {
  // Скачивает файл, разбирает его и создаёт меш прямо в сцене.
  const result = await ImportMeshAsync(MODEL_URL, scene);

  // Пока файл качался, сцену могли уничтожить (StrictMode в dev, размонтирование).
  // Тогда результат не нужен.
  if (scene.isDisposed) {
    result.meshes.forEach((m) => m.dispose());
    return null;
  }

  // Бинарный STL всегда даёт один меш.
  // instanceof сужает тип AbstractMesh до Mesh: только у Mesh есть «запекание» вершин.
  const mesh = result.meshes[0];
  if (!(mesh instanceof Mesh)) {
    throw new Error("В STL-файле не найден меш");
  }
  mesh.name = "teeth";

  placeAtOrigin(mesh);
  mesh.material = createEnamelMaterial(scene);

  // mesh.showBoundingBox = true; //Показать бокс

  return mesh;
}

// getBoundingInfo() возвращает один объект в котором есть и кробока и сфера. Значения о boundingBox(бокс построенный вокруг нашего меша) или boundingSphere(это сфера описанная вокруг boundingBox).
// Меш может иметь сложную геометрию,а простые фигуры(бокс или сфера) помогают быстро получить приблизительные значения без просчета всех вершин(размер, положение, "отсечение по видимости", т. д)

// Калибровка: приводим модель к стандартной позе.
// 1) поворот, 2) центр рамки → (0,0,0), 3) запекание в вершины, 4) пересчёт рамки.
// (Мировая матрица всегда применяет: масштаб → поворот → сдвиг. Поэтому центр ищем после поворота.)
// Цена — один проход по вершинам при загрузке. Исходные координаты из файла теряются, но они нам не нужны.

function placeAtOrigin(mesh: Mesh): void {
  mesh.rotation = MODEL_ROTATION.clone();
  moveCenterTo(mesh, new Vector3(0, 0, 0));
  mesh.bakeCurrentTransformIntoVertices(); // Запекание меша - один раз применяет трансформацию к вершинам меша в памяти. Сама трансформация сбрасывается(position/rotation в ноль, а scaling в единицу).
  // Приводит изначальный radius меша к значению radiusWorld. Т.е. способ поменять координаты вершин в буфере памяти. В данном случае - поворачивает модель и сдвигает её центр в (0, 0, 0), затем «запекает»
  mesh.refreshBoundingInfo(); // Рамка была посчитана по старым вершинам. Пересчитываем по новым: центр теперь около (0,0,0), размеры коробки могут измениться из-за поворота.
}

// Сдвигает меш так, чтобы центр его рамки оказался в точке target.
function moveCenterTo(mesh: Mesh, target: Vector3): void {
  // Обычно мировая матрица пересчитывается перед кадром. Здесь делаю это сразу,
  // чтобы рамка модели (bounding box) учла поворот сейчас, а не перед отрисовкой. Т.к. далее я буду калибровать центр и мне нужно новое(актуальное) значение
  mesh.computeWorldMatrix(true); // пересчитать принудительно
  const center = mesh.getBoundingInfo().boundingBox.centerWorld;
  // Вектор сдвига = куда − откуда.
  const offset = target.subtract(center);
  mesh.position.addInPlace(offset);
}

// Создаю новый экземпляр StandardMaterial и собираю объект enamel для mesh.material
function createEnamelMaterial(scene: Scene): StandardMaterial {
  const enamel = new StandardMaterial("enamel", scene);
  // Основной (рассеянный, diffuse) цвет поверхности
  enamel.diffuseColor = new Color3(0.93, 0.9, 0.82);
  // Цвет блика
  enamel.specularColor = new Color3(0.4, 0.4, 0.38);
  // Острота блика (чем больше значение, тем меньше и резче блик). Добиваюсь «влажного» глянца.
  enamel.specularPower = 64;
  return enamel;
}

// У меша стоит различать radius и radiusWorld.
// radius — радиус в локальных координатах меша, как вершины треугольников лежат в буфере(память видеокарты). Это значение по дефолту постоянное
// radiusWorld - Это радиус отрисованного меша в мире сцены. Коротко говоря radius с учётом масштаба(scaling) меша. position и rotation - position и rotation радиус не меняют, только двигают центр (centerWorld).
