"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  ChevronDown,
  CircleHelp,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Search,
  Settings,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/admin/actions";
const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];
export function Shell({
  children,
  email,
  storeName,
}: {
  children: React.ReactNode;
  email: string;
  storeName: string;
}) {
  const path = usePathname(),
    router = useRouter();
  const [open, setOpen] = useState(false),
    [pending, startTransition] = useTransition();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible")
        startTransition(() => router.refresh());
    }, 60000);
    return () => clearInterval(id);
  }, [router]);
  return (
    <div className="a-shell">
      {open && (
        <button
          className="a-sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`a-sidebar ${open ? "is-open" : ""}`}>
        <div className="a-brand">
          <Link href="/admin">
            zylo<span>®</span>
          </Link>
          <span className="a-business-label">BUSINESS</span>
          <button
            className="a-mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <Link
          href="/admin/settings"
          className="a-store-switch"
          onClick={() => setOpen(false)}
        >
          <span className="a-store-icon">
            <ShoppingBag size={19} />
          </span>
          <span>
            <strong>{storeName}</strong>
            <small>Your workspace</small>
          </span>
          <ChevronDown size={15} />
        </Link>
        <p className="a-nav-label">WORKSPACE</p>
        <nav aria-label="Dashboard">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={
                path === href || (href !== "/admin" && path.startsWith(href))
                  ? "is-active"
                  : ""
              }
            >
              <Icon size={18} strokeWidth={1.7} />
              <span>{label}</span>
              {label === "Overview" && <span className="a-nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="a-sidebar-bottom">
          <p className="a-nav-label">MANAGE</p>
          <Link
            href="/admin/settings"
            className={path === "/admin/settings" ? "is-active" : ""}
            onClick={() => setOpen(false)}
          >
            <Settings size={18} />
            Settings
          </Link>
          <Link href="/" target="_blank">
            <ExternalLink size={18} />
            View storefront
            <ArrowUpRight size={14} className="a-push" />
          </Link>
          <div className="a-side-tip">
            <CircleHelp size={18} />
            <strong>Made for your next chapter.</strong>
            <p>Your products, people and orders. All in one place.</p>
            <Link href="/admin/products/new" onClick={() => setOpen(false)}>
              List your next product <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="a-owner">
            <span>{email[0]?.toUpperCase()}</span>
            <div>
              <strong>Store owner</strong>
              <small title={email}>{email}</small>
            </div>
            <form action={logoutAction}>
              <button aria-label="Sign out" title="Sign out">
                <LogOut size={17} />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="a-workspace">
        <header className="a-topbar">
          <button
            className="a-menu"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="a-breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>
              {path.includes("/products/")
                ? "Products"
                : (NAV.find((n) => n.href === path || n.href !== "/admin" && path.startsWith(n.href+"/"))?.label ?? "Settings")}
            </strong>
          </div>
          <form action="/admin/orders" className="a-global-search">
            <Search size={15} />
            <input
              name="q"
              placeholder="Search orders or customers…"
              aria-label="Search orders or customers"
            />
          </form>
          <button
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
            className="a-refresh"
            onClick={() => startTransition(() => router.refresh())}
          >
            <RefreshCw size={16} className={pending ? "animate-spin" : ""} />
          </button>
          <span className="a-live-indicator">
            <i />
            Store connected
          </span>
        </header>
        <main id="main" className="a-main">
          {children}
        </main>
        <footer className="a-main-footer">
          <span>ZYLO BUSINESS</span>
          <span>Your store. Your next big thing.</span>
          <span>INR ₹ · India</span>
        </footer>
      </div>
    </div>
  );
}
