import { PageShell } from "@/components/layout/PageShell/PageShell";
import { workProjects } from "@/data/work";
import { WorkGalleryClient } from "./WorkGalleryClient";
import styles from "./work.module.scss";

export default function WorkPage() {
  return (
    <PageShell variant="work">
      <section className={styles["work-page"]} aria-labelledby="work-title">
        <WorkGalleryClient projects={workProjects} />
      </section>
    </PageShell>
  );
}
