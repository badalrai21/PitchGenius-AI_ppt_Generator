"use client";

import React from "react";

const cardBase =
  "w-full h-14 rounded-xl flex flex-col justify-center p-2.5 border border-slate-200/70 dark:border-slate-700/50 group-hover:border-cyan-500/50 transition-all duration-300 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-sm group-hover:shadow-md";

export function TitleLayoutIcon() {
  return (
    <div className={`${cardBase} items-center justify-center gap-1.5`}>
      <div className="h-2 w-3/4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
      <div className="h-1 w-1/2 rounded-full bg-slate-300 dark:bg-slate-600" />
    </div>
  );
}

export function BulletsLayoutIcon() {
  return (
    <div className={`${cardBase} gap-1.5`}>
      <div className="h-1.5 w-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
      <div className="space-y-1 mt-0.5">
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-cyan-500 shrink-0" />
          <div className="h-1 w-3/4 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-1 rounded-full bg-cyan-500 shrink-0" />
          <div className="h-1 w-1/2 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
      </div>
    </div>
  );
}

export function TwoColumnLayoutIcon() {
  return (
    <div className={`${cardBase} justify-between`}>
      <div className="h-1.5 w-1/3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
      <div className="grid grid-cols-2 gap-1.5 flex-1 mt-1.5">
        <div className="bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/20 rounded-md p-1 flex flex-col gap-0.5 justify-center">
          <div className="h-1 w-3/4 rounded-full bg-cyan-500/60" />
          <div className="h-0.5 w-full rounded-full bg-slate-300/60 dark:bg-slate-600/60" />
        </div>
        <div className="bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/20 rounded-md p-1 flex flex-col gap-0.5 justify-center">
          <div className="h-1 w-3/4 rounded-full bg-purple-500/60" />
          <div className="h-0.5 w-full rounded-full bg-slate-300/60 dark:bg-slate-600/60" />
        </div>
      </div>
    </div>
  );
}

export function MetricsLayoutIcon() {
  return (
    <div className={`${cardBase} justify-between`}>
      <div className="h-1.5 w-1/3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
      <div className="grid grid-cols-3 gap-1 mt-1.5">
        <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-md h-6 flex flex-col justify-center items-center gap-0.5 border border-cyan-500/20">
          <div className="h-2 w-3 rounded-sm bg-gradient-to-b from-cyan-500 to-blue-600" />
          <div className="h-[2px] w-4 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-md h-6 flex flex-col justify-center items-center gap-0.5 border border-purple-500/20">
          <div className="h-2 w-3 rounded-sm bg-gradient-to-b from-purple-500 to-pink-500" />
          <div className="h-[2px] w-4 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 rounded-md h-6 flex flex-col justify-center items-center gap-0.5 border border-emerald-500/20">
          <div className="h-2 w-3 rounded-sm bg-gradient-to-b from-emerald-500 to-teal-500" />
          <div className="h-[2px] w-4 rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
      </div>
    </div>
  );
}

export function QuoteLayoutIcon() {
  return (
    <div className={`${cardBase} items-center justify-center gap-1.5 text-center`}>
      <div className="h-2.5 w-2.5 rounded-full bg-cyan-500/30 flex items-center justify-center">
        <div className="h-1 w-1 rounded-full bg-cyan-500" />
      </div>
      <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600" />
      <div className="h-0.5 w-6 rounded-full bg-slate-300 dark:bg-slate-600" />
    </div>
  );
}

// Layout to Icon component dynamic dictionary
export const LAYOUT_ICON_MAP: Record<string, React.ComponentType> = {
  title: TitleLayoutIcon,
  bullets: BulletsLayoutIcon,
  two_column: TwoColumnLayoutIcon,
  metrics: MetricsLayoutIcon,
  quote: QuoteLayoutIcon,
};