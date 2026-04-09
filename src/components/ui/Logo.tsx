'use client';

import Image from "next/image";
import Link from "next/link";

type LogoAlign = "center" | "left";

interface LogoProps {
  align?: LogoAlign;
  withLink?: boolean;
}

export function Logo({ align = "center", withLink = false }: LogoProps) {
  const isCenter = align === "center";

  const content = (
    <>
      <div className="inline-flex items-center justify-center">
        <Image
          src="/task-logo.png"
          alt="Task Planner"
          width={62}
          height={32}
          className="h-8 w-auto"
          priority
        />
      </div>
      <div className="text-sm font-semibold tracking-tight text-foreground">
        Task Planner
      </div>
    </>
  );

  return (
    <div
      className={`flex flex-col gap-2 ${
        isCenter ? "items-center text-center" : "items-start text-left"
      }`}
    >
      {withLink ? (
        <Link href="/" className="flex flex-col items-center gap-2">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  );
}