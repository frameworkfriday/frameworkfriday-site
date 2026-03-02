import iconDecisionSprint from "../../assets/images/icon-decision-sprint.png";
import iconAcademy from "../../assets/images/icon-academy.png";
import iconForum from "../../assets/images/icon-forum.png";

type Product = "decision-sprint" | "academy" | "forum";
type LogoSize = "sm" | "md" | "lg";

const config: Record<Product, { icon: string; bg: string; invert: boolean; alt: string }> = {
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

const sizes: Record<LogoSize, { container: string; icon: string }> = {
  sm: { container: "w-10 h-10 rounded-lg", icon: "h-6 w-6" },
  md: { container: "w-12 h-12 rounded-xl", icon: "h-7 w-7" },
  lg: { container: "w-16 h-16 rounded-2xl", icon: "h-10 w-10" },
};

interface ProductLogoProps {
  product: Product;
  size?: LogoSize;
  className?: string;
}

export default function ProductLogo({ product, size = "md", className = "" }: ProductLogoProps) {
  const { icon, bg, invert, alt } = config[product];
  const { container, icon: iconSize } = sizes[size];

  return (
    <div
      className={`${container} ${bg} flex items-center justify-center shadow-sm ${className}`}
    >
      <img
        src={icon}
        alt={alt}
        className={`${iconSize} ${invert ? "brightness-0 invert" : ""}`}
      />
    </div>
  );
}

export { type Product };
