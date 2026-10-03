"use client";

import { useOptimistic, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { adjustItemQuantityAction } from "@/app/items/itemActions";

/** −/+ for an item's quantity on its detail page. Every click saves right
 * away; the number updates immediately and then settles on whatever the
 * server has (which includes other people's clicks). */
export default function QuantityStepper({ itemId, quantity }: { itemId: string; quantity: number }) {
  const [pending, startTransition] = useTransition();
  const [shown, addChange] = useOptimistic(quantity, (current, delta: number) => Math.max(1, current + delta));

  function change(delta: number) {
    startTransition(async () => {
      addChange(delta);
      await adjustItemQuantityAction(itemId, delta);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="join">
        <button
          type="button"
          className="btn join-item btn-sm btn-square"
          onClick={() => change(-1)}
          disabled={shown <= 1}
          aria-label="Menge verringern"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span
          className="join-item flex min-w-12 items-center justify-center border border-base-300 px-3 text-sm font-semibold tabular-nums"
          aria-live="polite"
        >
          {shown}
        </span>
        <button
          type="button"
          className="btn join-item btn-sm btn-square"
          onClick={() => change(1)}
          aria-label="Menge erhöhen"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      {pending && (
        <span className="loading loading-spinner loading-xs text-base-content/40" aria-label="Wird gespeichert" />
      )}
    </div>
  );
}
