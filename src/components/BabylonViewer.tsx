import { useEffect, useRef } from "react";
import {
  Engine,
  // EngineStore
} from "@babylonjs/core";
import { createScene } from "../scene/createScene";
import "./BabylonViewer.css";

// Просмотрщик Babylon. Отвечает только за жизненный цикл: Engine, render loop, resize, dispose. Код сцены — в src/scene/.
//  React создаёт <canvas> в DOM, через useRef мы получаем на него ссылку и в useEffect отдаём движку. Дальше React в содержимое канваса не вмешивается — рисует Babylon.
//  Влженность: экран ← канвас (CSS) ← viewport камеры ← то, что камера видит в мире сцены.

export function BabylonViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Effect запускается после монтирования, когда <canvas> уже в DOM.
  // [] — запускается один раз за.
  // В dev StrictMode делает mount -> cleanup -> mount - проверка функции очистки.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Engine — посредник между кодом и видеокартой: держит WebGL-контекст канваса,
    // загружает данные на GPU и рисует кадры. true = сглаживание (antialias)
    const engine = new Engine(canvas, true);
    const scene = createScene(engine);

    // Цикл кадров (через requestAnimationFrame): функция вызывается перед каждым обновлением экрана.
    // scene.render() рисует один кадр.
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Следим за размером самого канваса, а не окна.
    // engine.resize() выставляет размер буфера рисования по CSS-размеру канваса.
    // Callback срабатывает и сразу после observe() — буфер верный с первого кадра.
    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    resizeObserver.observe(canvas);

    // Cleanup: при размонтировании и в StrictMode после первого mount.
    // Сначала отключаем observer, чтобы он не вызвал resize() у уничтоженного движка.
    return () => {
      resizeObserver.disconnect();
      engine.dispose(); // останавливает render loop и уничтожает сцены, меши, материалы
    };
  }, []);

  return <canvas ref={canvasRef} className="babylon-canvas" />;
}

// служебный вывод в консоль - проверка функции очистки
//  if (import.meta.env.DEV) {
//         console.info(
//           "[babylon] cleanup, engines alive:",
// // EngineStore.Instances.length — сколько движков Babylon сейчас живо
//           EngineStore.Instances.length
//         );
//       }
