import type {
  AboutPageContent,
  ContactPageContent,
  HomePageContent,
  ServicePageContent,
  WorkPageContent,
} from "@/types/site";

export const fallbackHomePage: HomePageContent = {
  eyebrow: "Larah Photo / London, Ontario",
  titleWords: ["Editorial", "photo", "stories", "with", "a", "pulse."],
  manifestoWords: ["Light", "Memory", "Motion"],
  manifestoImageOne: {
    src: "/images/figma/optimized/blue-sky-portrait.avif",
    alt: "Two women seated in a green field below blue and white clouds",
    width: 1365,
    height: 2048,
  },
  manifestoImageTwo: {
    src: "/images/figma/optimized/home-portrait.avif",
    alt: "Portrait session detail",
    width: 990,
    height: 562,
  },
  selectedWorkEyebrow: "Selected Work",
  servicesEyebrow: "Services",
  servicesTitle: "Choose the way your story is held.",
  closingImage: {
    src: "/images/figma/optimized/field-wide.avif",
    alt: "Two people standing apart in a wide green field",
    width: 2048,
    height: 1366,
  },
  closingTitle: "Let the frame remember how it felt.",
};

export const fallbackWorkPage: WorkPageContent = {
  eyebrow: "Portfolio / Selected stories",
  titleWords: ["Every", "frame", "has", "a", "before", "and", "after."],
  indexLabel: "Index",
};

export const fallbackAboutPage: AboutPageContent = {
  eyebrow: "About / Larah Photo",
  titleWords: ["A", "camera", "with", "a", "quiet", "heart."],
  largeText: "Presence before pose.",
  portraitOne: {
    src: "/images/figma/optimized/larah-about.avif",
    alt: "Larah portrait in warm sunset light",
    width: 990,
    height: 562,
  },
  portraitTwo: {
    src: "/images/figma/optimized/home-portrait.avif",
    alt: "Portrait session detail",
    width: 990,
    height: 562,
  },
  notes: [
    "Direction that feels calm, never staged.",
    "Warm textures, honest expressions, and space to breathe.",
    "A visual rhythm shaped around the person in front of the lens.",
  ],
  story: [
    "Larah is a photographer dedicated to honest moments, meaningful connection, and timeless visual stories. Every session is shaped with trust, attention, and enough softness for the subject to feel present.",
    "Based in London, Ontario, working with portraits, couples, graduation, editorial sessions, and wedding stories.",
  ],
};

export const fallbackContactPage: ContactPageContent = {
  eyebrow: "Contact / Booking",
  titleWords: ["Tell", "me", "what", "the", "frame", "should", "feel", "like."],
  largeText: "Start here",
  fastestRouteLabel: "Fastest route",
  fastestRouteTitle: "Message on Instagram",
  locationLabel: "Based in",
  locationTitle: "London, Ontario",
  locationDescription:
    "Available for portraits, couples, graduation, brands, and weddings.",
  image: {
    src: "/images/figma/optimized/blue-sky-portrait.avif",
    alt: "Two women seated in a green field below blue and white clouds",
    width: 1365,
    height: 2048,
  },
  formEyebrow: "Email Inquiry",
  formTitle: "Prefer a slower note?",
  formCopy:
    "Share a little context, date, location, and the feeling you want the session to carry.",
};

export const fallbackServicePage: ServicePageContent = {
  eyebrow: "Services / Session design",
  titleWords: ["Packages", "for", "stories", "with", "shape."],
  image: {
    src: "/images/services/service-package.jpg",
    alt: "Photography package detail",
    width: 2000,
    height: 1333,
  },
  imageCopy:
    "Custom photography is available for intimate events, brands, and stories that need a different rhythm.",
};
