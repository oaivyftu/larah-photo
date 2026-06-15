import {
  faArrowRight,
  faArrowUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faEnvelope,
  faMinus,
  faPhone,
  faPlus,
  faChampagneGlasses,
  faUser,
  faUserGroup,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { faCircle } from "@fortawesome/free-regular-svg-icons";
import {
  faFacebook,
  faInstagram,
} from "@fortawesome/free-brands-svg-icons";

export const icons = {
  arrowRight: faArrowRight,
  arrowUp: faArrowUp,
  chevronDown: faChevronDown,
  chevronLeft: faChevronLeft,
  chevronRight: faChevronRight,
  close: faXmark,
  email: faEnvelope,
  facebook: faFacebook,
  instagram: faInstagram,
  minus: faMinus,
  phone: faPhone,
  plus: faPlus,
  portrait: faUser,
  ring: faChampagneGlasses,
  userGroup: faUserGroup,
  circle: faCircle,
} as const;
