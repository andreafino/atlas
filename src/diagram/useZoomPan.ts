import { useCallback, useEffect, useRef, useState } from "react";

interface View {
  z: number;
  tx: number;
  ty: number;
}

export function useZoomPan(contentWidth: number, contentHeight: number) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const view = useRef<View>({ z: 0.5, tx: 0, ty: 0 });
  const userMoved = useRef(false);
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean; pointerId: number } | null>(null);
  const [zoomLabel, setZoomLabel] = useState("—");

  const applyView = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const v = view.current;
    stage.style.transform = `translate(${v.tx}px, ${v.ty}px) scale(${v.z})`;
    setZoomLabel(Math.round(v.z * 100) + "%");
  }, []);

  const fit = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const w = vp.clientWidth;
    const h = vp.clientHeight;
    if (!w || !h) return;
    const z = Math.min((w - 40) / contentWidth, (h - 40) / contentHeight);
    view.current = { z, tx: (w - contentWidth * z) / 2, ty: (h - contentHeight * z) / 2 };
    userMoved.current = false;
    applyView();
  }, [applyView, contentHeight, contentWidth]);

  const zoomAt = useCallback(
    (factor: number, mx?: number, my?: number) => {
      const vp = viewportRef.current;
      if (!vp) return;
      const x = mx ?? vp.clientWidth / 2;
      const y = my ?? vp.clientHeight / 2;
      const v = view.current;
      const nz = Math.min(4, Math.max(0.15, v.z * factor));
      const k = nz / v.z;
      view.current = { z: nz, tx: x - (x - v.tx) * k, ty: y - (y - v.ty) * k };
      userMoved.current = true;
      applyView();
    },
    [applyView]
  );

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)), e.clientX - r.left, e.clientY - r.top);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      // Un pointerdown su un'entità (trascinabile) non deve avviare anche il pan del canvas:
      // essendo un listener nativo su un antenato, riceve l'evento prima che React possa fermarne la propagazione.
      if (e.button === 0 && (e.target as Element | null)?.closest("[data-no-pan]")) return;
      if (e.button === 1) e.preventDefault();
      drag.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY, tx: view.current.tx, ty: view.current.ty, moved: e.button === 1 };
      if (e.button === 1) {
        vp.setPointerCapture(e.pointerId);
        vp.style.cursor = "grabbing";
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      const d = drag.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > 4) {
        d.moved = true;
        vp.setPointerCapture(e.pointerId);
        vp.style.cursor = "grabbing";
      }
      if (!d.moved) return;
      view.current = { z: view.current.z, tx: d.tx + dx, ty: d.ty + dy };
      userMoved.current = true;
      applyView();
    };
    const onPointerUp = () => {
      drag.current = null;
      vp.style.cursor = "grab";
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("pointerdown", onPointerDown);
    vp.addEventListener("pointermove", onPointerMove);
    vp.addEventListener("pointerup", onPointerUp);
    vp.addEventListener("pointercancel", onPointerUp);

    let tries = 0;
    const tick = () => {
      if (userMoved.current) return;
      if (vp.clientWidth && vp.clientHeight) fit();
      if (++tries < 12) setTimeout(tick, 150);
    };
    tick();

    const ro = new ResizeObserver(() => {
      if (!userMoved.current) fit();
    });
    ro.observe(vp);

    return () => {
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("pointerdown", onPointerDown);
      vp.removeEventListener("pointermove", onPointerMove);
      vp.removeEventListener("pointerup", onPointerUp);
      vp.removeEventListener("pointercancel", onPointerUp);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyView, fit, zoomAt]);

  return {
    viewportRef,
    stageRef,
    zoomLabel,
    zoomIn: () => zoomAt(1.25),
    zoomOut: () => zoomAt(0.8),
    fit,
  };
}
