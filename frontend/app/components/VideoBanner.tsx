"use client";

import React from "react";
import Link from "next/link";

type VideoBannerProps = {
  src?: string;
  className?: string;
  style?: React.CSSProperties;
  rounded?: boolean;
  withBorder?: boolean;
  href?: string;
};

export default function VideoBanner({
  src = "/sanayicin-banner.mp4",
  className,
  style,
  rounded = true,
  withBorder = true,
  href,
}: VideoBannerProps) {
  const inner = (
    <div
      style={{
        position: "relative",
        borderRadius: rounded ? 12 : 0,
        overflow: "hidden",
        border: withBorder ? "1px solid var(--border)" : "none",
      }}
    >
      <video
        src={src}
        autoPlay
        muted
        loop
        playsInline
        controls={false}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    </div>
  );

  return (
    <section className={className} style={style}>
      {href ? (
        <Link href={href} style={{ display: "block", textDecoration: "none" }}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </section>
  );
}


