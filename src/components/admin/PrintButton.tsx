"use client";
import { Printer } from "lucide-react";
export function PrintButton() {
  return (
    <button className="a-button a-secondary" onClick={() => window.print()}>
      <Printer size={15} />
      Print packing slip
    </button>
  );
}
