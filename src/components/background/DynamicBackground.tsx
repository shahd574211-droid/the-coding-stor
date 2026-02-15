"use client";

import React from "react";
import dynamic from "next/dynamic";

const ColorBends = dynamic(() => import("./ColorBends"), { ssr: false });

const BRAND_COLORS = ["#404079", "#28AC28", "#FFE210"];

type DynamicBackgroundProps = {
  children: React.ReactNode;
  className?: string;
};

export default function DynamicBackground({ children, className = "" }: DynamicBackgroundProps) {
  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden bg-[#0c0c12] ${className}`}
      data-theme="dynamic"
    >
      {/* Dark base — يغطي كامل الشاشة */}
      <div
        className="fixed left-0 top-0 z-0 bg-[#0c0c12]"
        style={{ width: "100vw", height: "100vh", minHeight: "100dvh" }}
        aria-hidden
      />
      {/* تموج CSS — يعمل دائماً (نيلي، أخضر، أصفر) */}
      <div
        className="fixed left-0 top-0 z-[1] bg-wave-layer"
        style={{ width: "100vw", height: "100vh", minHeight: "100dvh" }}
        aria-hidden
      />
      {/* طبقة ColorBends WebGL — فوق التموج CSS */}
      <div
        className="fixed left-0 top-0 z-[2]"
        style={{ width: "100vw", height: "100vh", minHeight: "100dvh" }}
      >
        <div className="absolute inset-0 w-full h-full">
          <ColorBends
            colors={BRAND_COLORS}
            transparent
            speed={0.05}
            scale={1.1}
            frequency={0.7}
            warpStrength={0.65}
            mouseInfluence={0.7}
            parallax={0.35}
            noise={0.04}
            rotation={45}
            autoRotate={0.3}
          />
        </div>
      </div>
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
