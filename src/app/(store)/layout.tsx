import { Providers } from "@/components/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { storeSettings } from "@/lib/admin/queries";
import { categories } from "@/lib/catalog";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cats, settings] = await Promise.all([categories(), storeSettings()]);
  return (
    <Providers>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100]"
      >
        Skip to content
      </a>
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header categories={cats} />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer
          categories={cats}
          supportEmail={String(settings.support_email)}
          supportPhone={String(settings.support_phone)}
          storeName={String(settings.store_name)}
        />
      </div>
      <CartDrawer />
    </Providers>
  );
}
