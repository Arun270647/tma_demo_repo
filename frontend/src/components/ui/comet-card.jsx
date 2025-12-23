"use client";
import React from "react";

export const CometCard = ({ className, children }) => {
  return (
    <div
      className={`relative z-0 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-slate-800 p-[2px] ${className}`}
    >
      <div className="animate-rotate absolute inset-0 h-full w-full rounded-full bg-[conic-gradient(#0ea5e9_20deg,transparent_120deg)]" />
      <div className="relative z-20 flex w-full flex-col items-center justify-center rounded-2xl bg-slate-900 p-2">
        {children}
      </div>
    </div>
  );
};