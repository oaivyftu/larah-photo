import {
  faArrowRight,
  faArrowUp,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faEnvelope,
  faMinus,
  faPeopleRoof,
  faPhone,
  faPlus,
  faRing,
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
  family: faPeopleRoof,
  instagram: faInstagram,
  minus: faMinus,
  phone: faPhone,
  plus: faPlus,
  portrait: faUser,
  ring: faRing,
  userGroup: faUserGroup,
  circle: faCircle,
} as const;
