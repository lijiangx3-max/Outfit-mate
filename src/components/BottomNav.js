"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="bottom-nav">
            <Link href="/" className={`nav-item ${pathname === "/" ? "active" : ""}`}>
                <span>衣橱</span>
            </Link>
            <Link href="/capture" className={`nav-item ${pathname === "/capture" ? "active" : ""}`}>
                <div className="capture-btn">＋</div>
            </Link>
            <Link href="/settings" className={`nav-item ${pathname === "/settings" ? "active" : ""}`}>
                <span>设置</span>
            </Link>
        </nav>
    );
}
