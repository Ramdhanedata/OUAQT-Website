/* TODO(adel): every string here is waiting for your review. */
import type { BuilderCopy } from "./fr";

export const ar: BuilderCopy = {
  nav: "أنشئ برنامجك",

  landing: {
    title: "أنشئ برنامج متجرك",
    intro:
      "أجب عن بضعة أسئلة عن متجرك. وتخرج ببرنامجك جاهزاً للتثبيت على حاسوب المتجر.",
    duration: "من 10 إلى 20 دقيقة",
    noAccount: "لا حاجة إلى حساب للبدء",
    steps: [
      "متجرك واسمك وشعارك",
      "بضعة أسئلة عن طريقة عملك",
      "منتجاتك وموظفوك، إن كانت بين يديك",
      "رقمك التسلسلي والتحميل",
    ],
    start: "ابدأ",
    resume: "تابع من حيث توقفت",
  },

  shell: {
    stepOf: "الخطوة {current} من {total}",
    back: "رجوع",
    next: "متابعة",
    preview: "شاهد برنامجك",
    previewTitle: "برنامجك",
    previewEmpty: "سيظهر هنا إيصالك وشاشة البيع بمجرد أن تجيب.",
    close: "إغلاق",
    help: "مساعدة على واتساب",
    helpMessage: "مرحباً، أحتاج مساعدة في الخطوة {step} ({name}).",
    saved: "أجوبتك محفوظة",
    offline: "لا يوجد اتصال. ستُرسل أجوبتك فور عودة الشبكة.",
  },

  steps: {
    business: "متجرك",
    questions: "الأسئلة",
    products: "المنتجات والموظفون",
    serial: "رقمك التسلسلي",
  },

  placeholder: {
    title: "هذه الخطوة قادمة قريباً",
    body: "نحضّر أسئلة هذه الخطوة. عد بعد بضعة أيام، أو راسلنا على واتساب.",
  },
};
