import {
  landingLeadsToContact,
  packageAndQuestionsArePresent,
  projectLeadsBackToLandingPage,
  servicesLeadsToLandingPage,
  unknownRootPathIsA404,
} from "./journeys/landing";
import { underBothMotionPreferences } from "./support/variants";

underBothMotionPreferences("landing", {
  "the services page leads to a landing page": servicesLeadsToLandingPage,
  "a landing page's call to action leads to the contact page":
    landingLeadsToContact,
  "a project leads back to the landing page it came from":
    projectLeadsBackToLandingPage,
  "a landing page shows its package and its questions":
    packageAndQuestionsArePresent,
  "an unknown root path is a real 404 and the static routes are unharmed":
    unknownRootPathIsA404,
});
