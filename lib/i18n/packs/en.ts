import type { Pack } from "@/app-ui/packs";

/*
 * The landing page for each trade, in English.
 *
 * This file is the shape every language follows, the way en.ts is for the
 * rest of the site. French is the reference for the wording itself: it is
 * written first, and the other two follow it.
 *
 * Nothing here may claim a figure, a client or a date. A trade that is not
 * open yet says so and takes a phone number.
 */
export type PackSection = { title: string; body: string };
export type PackWorry = { question: string; answer: string };

export type PackPageCopy = {
  title: string;
  description: string;
  heading: string;
  intro: string;
  cta: string;
  does: PackSection[];
  worries: PackWorry[];
};

export type PackPagesCopy = {
  common: {
    doesHeading: string;
    previewHeading: string;
    previewBody: string;
    worriesHeading: string;
    closingHeading: string;
    closingBody: string;
    soonHeading: string;
    soonBody: string;
    pricing: string;
    otherTrades: string;
    trial: string;
  };
} & Record<Pack, PackPageCopy>;

export const packPagesEn: PackPagesCopy = {
  common: {
    doesHeading: "What the software does",
    previewHeading: "The screens, before you decide",
    previewBody:
      "These are the screens as they will come out at your place. The receipt carries your own name as soon as you type it.",
    worriesHeading: "What owners ask us",
    closingHeading: "Start with the first question",
    closingBody:
      "It takes under twenty minutes, and you watch the result settle as you answer.",
    soonHeading: "This trade is not open yet",
    soonBody: "Leave your number and we will tell you the day it is.",
    pricing: "See the prices",
    otherTrades: "The other trades",
    trial: "Free trial of {days} days",
  },

  pharmacy: {
    title: "Pharmacy management software, built online | OUAQT",
    description:
      "Build your pharmacy's software by answering a few questions. Expiry dates, batch numbers, selling by box or by strip, customer credit. It works with no internet.",
    heading: "Your pharmacy's software, built around the way you work",
    intro:
      "You answer a few questions about your pharmacy and you leave with the software that fits it: selling by the box or by the strip, expiry dates, batch numbers, and accounts for the customers who pay later. It installs on the counter PC and works with no internet.",
    cta: "Build my pharmacy's software",
    does: [
      {
        title: "Sell by the box or by the strip",
        body: "The price follows the unit you pick at the counter, and stock moves on both sides without any arithmetic in your head.",
      },
      {
        title: "Expiry dates in plain sight",
        body: "Every delivery carries its date. The software shows you what is coming to an end before the box is left on the shelf.",
      },
      {
        title: "Batch numbers kept",
        body: "The batch is recorded with the box and can be found again later, without opening a folder.",
      },
      {
        title: "Stock that keeps itself",
        body: "Every sale, every delivery and every return leaves a trace. Stock is never a number typed by hand.",
      },
      {
        title: "Customers who pay at the end of the month",
        body: "You open an account, you record what is owed, and you see at a glance who owes what.",
      },
      {
        title: "The evening cash count in a minute",
        body: "You count the drawer, the software shows what it expected, and the gap appears straight away.",
      },
    ],
    worries: [
      {
        question: "What if the power cuts in the middle of a sale?",
        answer:
          "The sale is written to the disk before the screen moves on. When the PC starts again, it is there.",
      },
      {
        question: "Do my sales go anywhere?",
        answer:
          "No. Your sales, your stock and your customers' accounts stay on your own computers. We never receive them.",
      },
      {
        question: "I have no time to type in all my products",
        answer:
          "You send your Excel file as it is, untidy included, and the software reads it. You check the first rows before anything is kept.",
      },
      {
        question: "My assistant reads Arabic better",
        answer:
          "The sale screen can be in Arabic or in French. The software's language is chosen separately from yours.",
      },
    ],
  },

  restaurant: {
    title: "Restaurant POS software | OUAQT",
    description:
      "Your restaurant's till software: the tables, orders held open while the table eats, the kitchen ticket and the bill at the end. Coming soon.",
    heading: "The till software for your restaurant",
    intro:
      "The tables in your room, orders that stay open while people eat, the ticket that goes to the kitchen, and the bill at the end. On the PC in the room, with no internet.",
    cta: "Build my restaurant's software",
    does: [
      {
        title: "Your room as it really is",
        body: "Your tables, in your own areas: the room, the terrace, upstairs. You find them on screen the way you see them from the till.",
      },
      {
        title: "An order that stays open",
        body: "A customer orders a starter, then a dish, then tea. It all goes onto the same table, and payment happens once, at the end.",
      },
      {
        title: "The kitchen ticket",
        body: "What is ordered comes out printed in the kitchen with the table number, so nobody has to shout across the room.",
      },
      {
        title: "Who took what",
        body: "Every waiter has his own code. In the evening you see what went through each of them.",
      },
      {
        title: "The evening cash count",
        body: "You count the drawer, the software shows what it expected, and the gap appears straight away.",
      },
      {
        title: "The bill in your name",
        body: "The restaurant's name, address and phone, in French or in Arabic, on an 80mm printer.",
      },
    ],
    worries: [
      {
        question: "What if the power cuts in the middle of service?",
        answer:
          "Open orders are written to the disk on every addition. When the PC starts again, the tables are as you left them.",
      },
      {
        question: "Do my figures go anywhere?",
        answer: "No. They stay on your computer. We never receive them.",
      },
      {
        question: "How many tables can it hold?",
        answer:
          "From one to two hundred. Past twenty-four they group by area, so the screen stays readable.",
      },
      {
        question: "My waiters do not read French",
        answer: "The screen can be in Arabic or in French, as you prefer.",
      },
    ],
  },

  bakery: {
    title: "Bakery management software | OUAQT",
    description:
      "Your bakery's software: the day's production, orders placed ahead with a deposit, the counter sale and regulars' credit. Coming soon.",
    heading: "Your bakery's software",
    intro:
      "What came out of the oven this morning, what was sold, what is left, and the orders your customers place ahead. On the shop PC, with no internet.",
    cta: "Build my bakery's software",
    does: [
      {
        title: "The day's production",
        body: "You record what comes out of the oven. In the evening you see what went and what is left, without counting the trays again.",
      },
      {
        title: "Orders placed ahead",
        body: "A customer orders for Friday and leaves a deposit. The order and the deposit are recorded, and the rest to pay follows until delivery.",
      },
      {
        title: "Regulars who pay at the end of the month",
        body: "You open an account, you record what is owed, and you see who owes what.",
      },
      {
        title: "The counter sale",
        body: "The screen is built to be quick when there is a queue: today's products first, the rest beside them.",
      },
      {
        title: "The evening cash count",
        body: "You count the drawer, the software shows what it expected, and the gap appears straight away.",
      },
      {
        title: "The receipt in your name",
        body: "The bakery's name, address and phone, in French or in Arabic.",
      },
    ],
    worries: [
      {
        question: "What if the power cuts?",
        answer:
          "The sale is written to the disk before the screen moves on. When the PC starts again, it is there.",
      },
      {
        question: "Do my figures go anywhere?",
        answer: "No. They stay on your computer. We never receive them.",
      },
      {
        question: "My prices change often",
        answer:
          "You change a price in the software and it applies to the next sale. There is no file to send back to us.",
      },
      {
        question: "My counter staff read Arabic better",
        answer: "The screen can be in Arabic or in French, as you prefer.",
      },
    ],
  },

  warehouse: {
    title: "Warehouse stock management software | OUAQT",
    description:
      "Your warehouse's software: goods in, goods out, several locations, and stock that keeps itself. Coming soon.",
    heading: "Stock management software for your warehouse",
    intro:
      "What comes in, what goes out, and what is left, location by location. Stock is never a number typed by hand: it comes from the movements. On your computer, with no internet.",
    cta: "Build my warehouse's software",
    does: [
      {
        title: "Goods in and goods out",
        body: "Every movement is recorded with its date, its quantity and the person who made it. Nothing moves without leaving a trace.",
      },
      {
        title: "Several locations",
        body: "One warehouse or twenty. You see the stock of each, and what moved from one to another.",
      },
      {
        title: "Stock you can explain",
        body: "Stock is the sum of the movements. When a figure surprises you, you go back to the line that moved it.",
      },
      {
        title: "Counting without closing the warehouse",
        body: "You count, you enter what you counted, and the gap appears line by line.",
      },
      {
        title: "Customers who take now and pay later",
        body: "You open an account, you record what is owed, and you see who owes what.",
      },
      {
        title: "Your products, read from your own file",
        body: "You send your Excel file as it is and the software reads it.",
      },
    ],
    worries: [
      {
        question: "What if the power cuts?",
        answer:
          "A movement is written to the disk before the screen moves on. When the PC starts again, it is there.",
      },
      {
        question: "Do my figures go anywhere?",
        answer: "No. They stay on your computer. We never receive them.",
      },
      {
        question: "How many products can it hold?",
        answer:
          "Several thousand. Search stays immediate at five thousand items.",
      },
      {
        question: "My storekeeper reads Arabic better",
        answer: "The screen can be in Arabic or in French, as you prefer.",
      },
    ],
  },
};
