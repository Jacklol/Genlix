"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

const headStates = [
  "/assets/cow-2-5d/states/00-profile-left.png",
  "/assets/cow-2-5d/states/01-left-three-quarter-v2.png",
  "/assets/cow-2-5d/states/02-front.png",
  "/assets/cow-2-5d/states/03-right-three-quarter.png",
  "/assets/cow-2-5d/states/04-profile-right.png",
];

const tailStates = {
  inward: "/assets/cow-2-5d/tail-states/01-tail-swat-inward.png",
  outward: "/assets/cow-2-5d/tail-states/02-tail-swat-outward.png",
} as const;

type TailState = "rest" | keyof typeof tailStates;
type Point = { x: number; y: number };

function stateOpacity(index: number, position: number) {
  return index === Math.round(position) ? 1 : 0;
}

export default function CowDemo() {
  const [headPosition, setHeadPosition] = useState(1);
  const [tailState, setTailState] = useState<TailState>("rest");
  const [pointer, setPointer] = useState<Point>({ x: 0.5, y: 0.5 });
  const [isPointerVisible, setIsPointerVisible] = useState(false);
  const targetHeadRef = useRef(1);
  const currentHeadRef = useRef(1);
  const tailCooldownRef = useRef(0);
  const tailResetRef = useRef<number | null>(null);

  useEffect(() => {
    let animationFrame = 0;

    const followTarget = () => {
      const current = currentHeadRef.current;
      const target = targetHeadRef.current;
      const next = current + (target - current) * 0.105;

      if (Math.abs(next - current) > 0.0005) {
        currentHeadRef.current = next;
        setHeadPosition(next);
      }

      animationFrame = requestAnimationFrame(followTarget);
    };

    animationFrame = requestAnimationFrame(followTarget);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    let idleTimer = 0;
    let restTimer = 0;

    const scheduleIdleSwat = () => {
      idleTimer = window.setTimeout(() => {
        setTailState(Math.random() > 0.5 ? "inward" : "outward");
        restTimer = window.setTimeout(() => {
          setTailState("rest");
          scheduleIdleSwat();
        }, 520);
      }, 3200 + Math.random() * 2600);
    };

    scheduleIdleSwat();

    return () => {
      window.clearTimeout(idleTimer);
      window.clearTimeout(restTimer);
      if (tailResetRef.current !== null) {
        window.clearTimeout(tailResetRef.current);
      }
    };
  }, []);

  function swatTail(nextState: Exclude<TailState, "rest">) {
    const now = performance.now();
    if (now < tailCooldownRef.current) return;

    tailCooldownRef.current = now + 760;
    setTailState(nextState);

    if (tailResetRef.current !== null) {
      window.clearTimeout(tailResetRef.current);
    }

    tailResetRef.current = window.setTimeout(() => {
      setTailState("rest");
    }, 480);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1);

    targetHeadRef.current = x * (headStates.length - 1);
    setPointer({ x, y });
    setIsPointerVisible(true);

    const isNearTail = x > 0.68 && y > 0.12 && y < 0.82;
    if (isNearTail) {
      swatTail(x > 0.84 ? "inward" : "outward");
    }
  }

  function handlePointerLeave() {
    targetHeadRef.current = 1;
    setIsPointerVisible(false);
  }

  return (
    <div className="cow-demo">
      <header className="cow-demo-heading">
        <div>
          <p className="demo-kicker">2.5D CHARACTER · WORK IN PROGRESS</p>
          <h2>Живая анатомия</h2>
        </div>
        <p>
          Ведите курсором по корове. Голова следит за движением,
          а хвост реагирует в задней зоне.
        </p>
      </header>

      <div
        className="cow-stage"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        aria-label="Интерактивная анатомическая корова"
      >
        <div className="cow-image-stack">
          {headStates.map((source, index) => (
            <Image
              className="cow-head-state"
              key={source}
              src={source}
              alt=""
              fill
              priority
              sizes="(max-width: 980px) 100vw, 75vw"
              draggable={false}
              style={{ opacity: stateOpacity(index, headPosition) }}
            />
          ))}

          <Image
            className={`cow-tail-state cow-tail-inward ${
              tailState === "inward" ? "is-visible" : ""
            }`}
            src={tailStates.inward}
            alt=""
            fill
            priority
            sizes="(max-width: 980px) 100vw, 75vw"
            draggable={false}
          />
          <Image
            className={`cow-tail-state cow-tail-outward ${
              tailState === "outward" ? "is-visible" : ""
            }`}
            src={tailStates.outward}
            alt=""
            fill
            priority
            sizes="(max-width: 980px) 100vw, 75vw"
            draggable={false}
          />
        </div>

        <span
          className={`cow-fly ${isPointerVisible ? "is-visible" : ""}`}
          style={{ left: `${pointer.x * 100}%`, top: `${pointer.y * 100}%` }}
          aria-hidden="true"
        >
          <i />
          <i />
          <b />
        </span>
      </div>

      <footer className="cow-demo-status" aria-label="Статус функций">
        <span className="is-ready"><i /> Head tracking</span>
        <span className="is-ready"><i /> Tail response</span>
        <span className="is-next"><i /> Blink · next</span>
      </footer>
    </div>
  );
}
