import { SiteFooter } from "@/components/layout/SiteFooter/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader/SiteHeader";
import { getSiteSettings } from "@/sanity/fetchers";
import styles from "./PageShell.module.scss";

type PageShellProps = {
  children?: React.ReactNode;
  variant: "home" | "work" | "project" | "about" | "service" | "contact";
};

const activeHrefByVariant: Record<PageShellProps["variant"], string> = {
  home: "/",
  work: "/work",
  project: "/work",
  about: "/about",
  service: "/service",
  contact: "/contact",
};

export async function PageShell({ children, variant }: PageShellProps) {
  const settings = await getSiteSettings();

  return (
    <div className={styles["page-shell"]} id="top">
      <SiteHeader
        activeHref={activeHrefByVariant[variant]}
      />
      <main
        className={[
          styles["page-shell__main"],
          styles[`page-shell__main--${variant}`],
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </main>
      <SiteFooter settings={settings} />
    </div>
  );
}
