import Image from "next/image";
import iconDecisionSprint from "@/assets/images/icon-decision-sprint.png";
import iconAcademy from "@/assets/images/icon-academy.png";
import iconForum from "@/assets/images/icon-forum.png";

type Product = "decision-sprint" | "academy" | "forum";
type LogoSize = "sm" | "md" | "lg";

const config: Record<Product, { icon: typeof iconDecisionSprint; bg: string; invert: boolean; alt: string }> = {
  "decision-sprint": {
    icon: iconDecisionSprint,
    bg: "bg-white",
    invert: false,
    alt: "Decision Sprint",
  },
  academy: {
    icon: iconAcademy,
    bg: "bg-gray-950",
    invert: true,
    alt: "The Academy",
  },
  forum: {
    icon: iconForum,
    bg: "bg-gray-950",
    invert: false,
    alt: "Operator Forum",
  },
};

const sizes: Record<LogoSize, { container: string; width: number; height: number }> = {
  sm: { container: "w-10 h-10 rounded-lg", width: 24, height: 24 },
  md: { container: "w-12 h-12 rounded-xl", width: 28, height: 28 },
  lg: { container: "w-16 h-16 rounded-2xl", width: 40, height: 40 },
};

interface ProductLogoProps {
  product: Product;
  size?: LogoSize;
  className?: string;
}

export default function ProductLogo({ product, size = "md", className = "" }: ProductLogoProps) {
  const { icon, bg, invert, alt } = config[product];
  const { container, width, height } = sizes[size];

  return (
    <div
      className={`${container} ${bg} flex items-center justify-center shadow-sm ${className}`}
    >
      <Image
        src={icon}
        alt={alt}
        width={width}
        height={height}
        className={invert ? "brightness-0 invert" : ""}
      />
    </div>
  );
}

export { type Product };
