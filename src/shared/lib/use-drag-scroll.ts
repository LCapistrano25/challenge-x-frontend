import { useEffect, useRef } from 'react';

/** Distância mínima (px) para um clique virar arrasto. */
const DRAG_THRESHOLD = 5;

/**
 * Permite rolar um contêiner horizontal arrastando com o mouse.
 * No toque a rolagem nativa já funciona; aqui só tratamos ponteiro do tipo "mouse".
 * Enquanto arrasta: marca `data-dragging`, limpa a seleção de texto e, ao soltar,
 * cancela o clique para não abrir o link do card por engano.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = el.scrollLeft;
      dragged = false;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      if (!dragged) {
        if (Math.abs(dx) < DRAG_THRESHOLD) return;
        dragged = true;
        el.dataset.dragging = 'true';
        el.setPointerCapture?.(event.pointerId);
        window.getSelection()?.removeAllRanges();
      }
      event.preventDefault();
      el.scrollLeft = startScroll - dx;
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      delete el.dataset.dragging;
      if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    };

    // Depois de arrastar, o "click" do mouseup não deve ativar links/botões.
    const onClickCapture = (event: MouseEvent) => {
      if (!dragged) return;
      dragged = false;
      event.preventDefault();
      event.stopPropagation();
    };

    // Evita o "arrastar link/imagem" nativo do navegador.
    const onDragStart = (event: DragEvent) => event.preventDefault();

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerEnd);
    el.addEventListener('pointercancel', onPointerEnd);
    el.addEventListener('click', onClickCapture, true);
    el.addEventListener('dragstart', onDragStart);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerEnd);
      el.removeEventListener('pointercancel', onPointerEnd);
      el.removeEventListener('click', onClickCapture, true);
      el.removeEventListener('dragstart', onDragStart);
    };
  }, []);

  return ref;
}
