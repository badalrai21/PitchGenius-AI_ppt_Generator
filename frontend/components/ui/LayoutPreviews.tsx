"use client";

import React from "react";

export function TitleLayoutIcon() {
  return (
    <div className="w-full h-12 bg-muted/40 rounded-lg flex flex-col justify-center items-center gap-1 p-2 border border-border/60 group-hover:border-teal/50 transition-colors">
      <div className="h-2 w-3/4 rounded-full bg-teal" />
      <div className="h-1.5 w-1/2 rounded-full bg-surf/60" />
    </div>
  );
}

export function BulletsLayoutIcon() {
  return (
    <div className="w-full h-12 bg-muted/40 rounded-lg flex flex-col justify-center gap-1.5 p-3 border border-border/60 group-hover:border-teal/50 transition-colors">
      <div className="h-2 w-1/2 rounded-full bg-teal" />
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-surf" />
          <div className="h-1 w-3/4 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-surf" />
          <div className="h-1 w-1/2 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}

export function TwoColumnLayoutIcon() {
  return (
    <div className="w-full h-12 bg-muted/40 rounded-lg flex flex-col justify-between p-2 border border-border/60 group-hover:border-teal/50 transition-colors">
      <div className="h-1.5 w-1/3 rounded-full bg-teal" />
      <div className="grid grid-cols-2 gap-1.5 flex-1 mt-1">
        <div className="bg-teal/5 border border-teal/10 rounded p-1 flex flex-col gap-0.5">
          <div className="h-1 w-3/4 rounded-full bg-teal/40" />
          <div className="h-0.5 w-full rounded-full bg-muted-foreground/20" />
        </div>
        <div className="bg-surf/5 border border-surf/10 rounded p-1 flex flex-col gap-0.5">
          <div className="h-1 w-3/4 rounded-full bg-surf/40" />
          <div className="h-0.5 w-full rounded-full bg-muted-foreground/20" />
        </div>
      </div>
    </div>
  );
}

export function MetricsLayoutIcon() {
  return (
    <div className="w-full h-12 bg-muted/40 rounded-lg flex flex-col justify-between p-2 border border-border/60 group-hover:border-teal/50 transition-colors">
      <div className="h-1.5 w-1/3 rounded-full bg-teal" />
      <div className="grid grid-cols-3 gap-1 mt-1">
        <div className="bg-teal/10 rounded h-5 flex flex-col justify-center items-center gap-0.5">
          <div className="h-2 w-3 rounded-full bg-teal" />
          <div className="h-[2px] w-4 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="bg-surf/10 rounded h-5 flex flex-col justify-center items-center gap-0.5">
          <div className="h-2 w-3 rounded-full bg-surf" />
          <div className="h-[2px] w-4 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="bg-frost/20 rounded h-5 flex flex-col justify-center items-center gap-0.5">
          <div className="h-2 w-3 rounded-full bg-frost" />
          <div className="h-[2px] w-4 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}

export function QuoteLayoutIcon() {
  return (
    <div className="w-full h-12 bg-muted/40 rounded-lg flex flex-col justify-center items-center gap-1.5 p-2 border border-border/60 group-hover:border-teal/50 transition-colors">
      <div className="h-2.5 w-2.5 rounded-full bg-teal/20" />
      <div className="h-1.5 w-2/3 rounded-full bg-teal" />
      <div className="h-1 w-1/4 rounded-full bg-muted-foreground/30" />
    </div>
  );
}