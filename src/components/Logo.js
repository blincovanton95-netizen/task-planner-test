'use client';

import Image from "next/image";

export function Logo({ align = "center" }) {
  const isCenter = align === "center";

  return (
    <div
      className={`flex flex-col gap-2 ${
        isCenter ? "items-center text-center" : "items-start text-left"
      }`}
    >
      <div className="inline-flex items-center justify-center">
        <Image
          src="/task-logo.png"
          alt="Task Planner logo"
          width={62}
          height={32}
          className="h-8 w-auto"
          priority
        />
      </div>
      <div>
        <div className="text-sm font-semibold tracking-tight text-slate-900">
          Task Planner
        </div>
      </div>
    </div>
  );
}

