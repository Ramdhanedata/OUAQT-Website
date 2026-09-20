/* TODO(adel): every string here is waiting for your review. */
import type { BuilderCopy } from "./fr";

export const en: BuilderCopy = {
  nav: "Build my software",

  landing: {
    title: "Build the software for your shop",
    intro:
      "Answer a few questions about your shop. You leave with your software, ready to install on the shop computer.",
    duration: "10 to 20 minutes",
    noAccount: "No account needed to start",
    steps: [
      "Your shop, your name and your logo",
      "A few questions about how you work",
      "Your products and staff, if you have them to hand",
      "Your serial number and the download",
    ],
    start: "Start",
    resume: "Pick up where you left off",
  },

  shell: {
    stepOf: "Step {current} of {total}",
    back: "Back",
    next: "Continue",
    preview: "See my software",
    previewTitle: "Your software",
    previewEmpty:
      "Your receipt and sale screen will appear here as soon as you answer.",
    close: "Close",
    help: "Help on WhatsApp",
    helpMessage: "Hello, I need help at step {step} ({name}).",
    saved: "Your answers are saved",
    offline: "Offline. Your answers will be sent when the network is back.",
  },

  steps: {
    business: "Your shop",
    questions: "Questions",
    products: "Products and staff",
    serial: "Your serial number",
  },

  packs: {
    heading: "What kind of business do you run?",
    pharmacy: "Pharmacy",
    bakery: "Bakery",
    restaurant: "Restaurant or cafe",
    warehouse: "Warehouse and stock",
    soon: "Coming soon",
    other: "My business is not on this list",
  },

  lead: {
    heading: "Tell us what you do",
    business: "Your business",
    businessHelp: "For example: hardware shop, hair salon, workshop.",
    phone: "Your phone number",
    submit: "Send",
    thanks: "Thank you. We will tell you as soon as your kind of business is ready.",
    error: "Your message did not go through. Try again, or write to us on WhatsApp.",
  },

  language: {
    heading: "Which language would you like to answer in?",
    appHeading: "And which language will your staff use the software in?",
    fr: "Français",
    ar: "العربية",
    en: "English",
  },

  name: {
    heading: "Your business name",
    latin: "In Latin letters",
    latinHelp: "This is the name at the top of the receipt.",
    arabic: "In Arabic, if you want",
    arabicHelp: "It goes under the first name on the receipt.",
    required: "Write your business name to continue.",
  },

  receiptDetails: {
    heading: "What appears on the receipt",
    help: "Both are optional. You can change them later.",
    phone: "Your phone",
    address: "Your address",
  },

  logo: {
    heading: "Your logo",
    help: "Optional. Take a photo or choose a file. It stays on your phone; only the prepared image is sent.",
    choose: "Choose an image",
    replace: "Change the image",
    remove: "Remove the logo",
    working: "Preparing your logo",
    colour: "On the screen",
    mono: "On the printed receipt",
    errorType: "Choose a PNG or JPEG image.",
    errorUnreadable: "This image could not be read. Try another one.",
    errorTooBig: "This image is too heavy even after preparing. Try another one.",
  },

  preview: {
    sale: "Sale screen",
    receipt: "Receipt",
    intro: "Here is your software with what you have just written.",
  },

  save: {
    saving: "Saving",
    saved: "Saved",
    failed: "Not saved yet. We are trying again.",
    unavailable: "Your answers are staying on this device for now.",
  },

  placeholder: {
    title: "This step is coming soon",
    body: "We are preparing the questions for this step. Come back in a few days, or write to us on WhatsApp.",
  },
};
