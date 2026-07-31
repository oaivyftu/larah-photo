import { Fragment } from "react";
import styles from "./WorkFilters.module.scss";

type WorkFiltersProps = {
  activeFilter: string;
  filters: {
    label: string;
    value: string;
  }[];
  onFilterChange: (filter: string) => void;
};

export function WorkFilters({
  activeFilter,
  filters,
  onFilterChange,
}: WorkFiltersProps) {
  return (
    <div className={styles["work-filters"]} aria-label="Work filters">
      <span className={styles["work-filters__label"]}>Filters:</span>
      <div className={styles["work-filters__list"]}>
        {filters.map((filter, index) => {
          const isActive = filter.value === activeFilter;

          return (
            <Fragment key={filter.value}>
              {index > 0 ? (
                <span aria-hidden="true" className={styles["work-filters__separator"]}>
                  /
                </span>
              ) : null}
              <button
                aria-pressed={isActive}
                className={`${styles["work-filters__button"]} ${
                  isActive ? styles["work-filters__button--active"] : ""
                }`}
                onClick={() => onFilterChange(filter.value)}
                type="button"
              >
                {filter.label}
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
