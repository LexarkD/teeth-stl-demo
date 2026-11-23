import type { ArcRotateCamera } from "@babylonjs/core";

// Подстройка панорамирования: точка модели под пальцем (или курсором при сдвиге
// правой кнопкой) остаётся под ним при любом зуме.
// По умолчанию panningSensibility — фиксированные «пиксели на единицу мира».
// У нас единица мира — 1 мм, поэтому сдвиг получался очень медленным.
export function enableNaturalPanning(camera: ArcRotateCamera): void {
  const scene = camera.getScene();
  const engine = scene.getEngine();

  // Пересчитываем перед каждым кадром: после зума расстояние до модели другое, и миллиметр модели занимает на экране другое число пикселей.
  // Подписка удалится сама вместе со сценой (engine.dispose → scene.dispose).
  scene.onBeforeRenderObservable.add(() => {
    // Высота канваса в CSS-пикселях (в них же приходит движение пальца) -  размер буфера рисования × hardwareScalingLevel.Движок сохраняет эти числа при engine.resize()
    const heightPx =
      engine.getRenderHeight() * engine.getHardwareScalingLevel();
    if (heightPx === 0) return; // канвас ещё не на экране

    // Сколько единиц мира (мм) видно по вертикали на расстоянии radius.
    const visibleHeight = 2 * camera.radius * Math.tan(camera.fov / 2);
    const pixelsPerUnit = heightPx / visibleHeight;

    // Инерция досдвигает камеру после каждого движения: суммарно сдвиг
    // в 1 / (1 − panningInertia) раз больше одного шага (при 0.9 — в 10 раз).
    camera.panningSensibility = pixelsPerUnit / (1 - camera.panningInertia);
  });
}
