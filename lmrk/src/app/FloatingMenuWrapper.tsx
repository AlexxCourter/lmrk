"use client";
import { usePathname } from "next/navigation";
import FloatingMenu from "../components/FloatingMenu";

export default function FloatingMenuWrapper() {
  const pathname = usePathname();
  if (pathname && pathname.startsWith("/meal-planner")) return null;
  return (
    <div className="relative z-10 flex justify-center">
      <FloatingMenu />
    </div>
  );
}
