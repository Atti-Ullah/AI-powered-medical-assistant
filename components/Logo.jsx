import Image from "next/image";

// The source image (2172x724) has generous transparent/white padding around the artwork.
// These wrappers crop to the artwork so the size classes describe what is actually visible.
const SRC = "/medisynix_logo.png";
// Same artwork with the dark navy wordmark recoloured white, for dark backgrounds
const SRC_LIGHT = "/medisynix_logo_light.png";
const FULL = { width: 2172, height: 724 };

// Full logo (mark + wordmark). Size it with a height class, e.g. "h-9 sm:h-11 lg:h-12";
// the width follows automatically, so it scales cleanly on every screen.
export default function Logo({ className = "h-10", priority = false, variant = "default", sizes = "(max-width: 640px) 160px, 200px" }) {
  return (
    <span className={`relative block aspect-[2010/490] shrink-0 overflow-hidden ${className}`}>
      <Image
        src={variant === "light" ? SRC_LIGHT : SRC}
        alt="Medisynix"
        width={FULL.width}
        height={FULL.height}
        priority={priority}
        sizes={sizes}
        draggable={false}
        style={{ position: "absolute", maxWidth: "none", height: "auto", width: "108.06%", left: "-4.478%", top: "-26.53%" }}
      />
    </span>
  );
}

// Just the cross mark, for tight spaces such as the collapsed sidebar.
export function LogoMark({ className = "h-10 w-10", priority = false, variant = "default" }) {
  return (
    <span className={`relative block aspect-square shrink-0 overflow-hidden ${className}`}>
      <Image
        src={variant === "light" ? SRC_LIGHT : SRC}
        alt="Medisynix"
        width={FULL.width}
        height={FULL.height}
        priority={priority}
        sizes="96px"
        draggable={false}
        style={{ position: "absolute", maxWidth: "none", height: "auto", width: "443.3%", left: "-19.8%", top: "-26.7%" }}
      />
    </span>
  );
}
