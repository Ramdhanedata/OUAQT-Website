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

  placeholder: {
    title: "This step is coming soon",
    body: "We are preparing the questions for this step. Come back in a few days, or write to us on WhatsApp.",
  },
};
