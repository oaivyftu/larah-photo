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
        {filters.map((filter) => {
          const isActive = filter.value === activeFilter;

          return (
            <button
              aria-pressed={isActive}
              className={`${styles["work-filters__button"]} ${
                isActive ? styles["work-filters__button--active"] : ""
              }`}
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
