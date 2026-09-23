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

  /* Written 2026-09-23 for the new trade. For Adel's review before it goes live. */
  shop: {
    title: "POS software for shops and groceries | OUAQT",
    description: "Your shop's till: sell by barcode or tiles, stock, customer credit, the evening count. Coming soon.",
    heading: "Till software for your shop",
    intro: "You scan or tap the item, the customer pays, and the stock goes down by itself. Your regulars' credit and the evening count are in the same place. On your computer, with no internet.",
    cta: "Build my shop's software",
    does: [
      {
        title: "Sell fast",
        body: "Barcode, name or a tile to tap: the item is on the ticket in a second, with the change to give.",
      },
      {
        title: "By weight or by the piece",
        body: "Sugar by the kilo, milk by the tin, on the same ticket.",
      },
      {
        title: "Stock that keeps itself",
        body: "Each sale takes it down, each delivery puts it up, and you see what will run out before it does.",
      },
      {
        title: "The credit book",
        body: "What each customer owes, line by line, and what they have paid.",
      },
      {
        title: "The evening count",
        body: "You count the drawer, the software shows what it expected, and any gap shows at once.",
      },
      {
        title: "Bankily, Masrvi, Sedad",
        body: "Mobile payments are recorded with the app's name, and the reports keep them apart.",
      },
    ],
    worries: [
      {
        question: "What if the power cuts?",
        answer: "Each sale is written to the disk before the screen moves on. When the PC starts again, it is there.",
      },
      {
        question: "Do my figures go anywhere?",
        answer: "No. They stay on your computer. We never receive them.",
      },
      {
        question: "My item list is already in Excel",
        answer: "You send the file as it is, and the software reads it.",
      },
    ],
  },
  /* Written 2026-09-23 for the new trade. For Adel's review before it goes live. */
  hotel: {
    title: "Management software for hotels and guest houses | OUAQT",
    description: "Your hotel's software: the room board, bookings, check-in and check-out, extras on the bill. Coming soon.",
    heading: "Management software for your hotel",
    intro: "Your rooms on one screen, free, occupied or to be cleaned. The booking, the arrival, the extras, and the bill at departure. On the front desk computer, with no internet.",
    cta: "Build my hotel's software",
    does: [
      {
        title: "The room board",
        body: "Every room with its state: free, occupied, booked for today, to be cleaned.",
      },
      {
        title: "Bookings",
        body: "The guest's name, phone, identity document and dates. A room cannot be given twice for the same night.",
      },
      {
        title: "The advance at booking",
        body: "It is recorded, it enters the till on the day it is paid, and it comes off the bill.",
      },
      {
        title: "Extras on the bill",
        body: "Meals, drinks, laundry: added to the room during the stay, paid at departure.",
      },
      {
        title: "The bill at departure",
        body: "The nights counted by themselves, the extras, the advance taken off, and the receipt printed.",
      },
      {
        title: "Occupancy",
        body: "How many nights sold out of how many possible, and what each month brought in.",
      },
    ],
    worries: [
      {
        question: "What if the power cuts?",
        answer: "Every booking and every payment is written to the disk at once. When the PC starts again, everything is there.",
      },
      {
        question: "Does my guests' data go anywhere?",
        answer: "No. It stays on your computer. We never receive it.",
      },
      {
        question: "My receptionist reads Arabic",
        answer: "The screen can be in Arabic or in French, as you prefer.",
      },
    ],
  },
  /* Written 2026-09-23 for the new trade. For Adel's review before it goes live. */
  transport: {
    title: "Software for transport and parcel companies | OUAQT",
    description: "Your transport company's software: departures, tickets by seat, parcels with their code, the passenger list. Coming soon.",
    heading: "Software for your transport company",
    intro: "Today's departures, the seats sold, the parcels received and handed over. Every ticket and every parcel is paid and recorded. On the counter's computer, with no internet.",
    cta: "Build my company's software",
    does: [
      {
        title: "Departures",
        body: "Each trip with its vehicle, its driver and its time, and how many seats are left.",
      },
      {
        title: "Tickets by seat",
        body: "The passenger's name and phone. A seat once sold cannot be sold a second time.",
      },
      {
        title: "Parcels with their code",
        body: "The sender, the receiver and a code the receiver gives at the arrival counter.",
      },
      {
        title: "Paid on sending or on arrival",
        body: "A parcel is paid by its sender or its receiver, as you already do.",
      },
      {
        title: "The list before departure",
        body: "The trip's passengers and parcels, printed for the driver.",
      },
      {
        title: "What each route brings in",
        body: "Tickets and parcels, trip by trip, day by day.",
      },
    ],
    worries: [
      {
        question: "What if the power cuts?",
        answer: "Each ticket is written to the disk before it is printed. When the PC starts again, it is there.",
      },
      {
        question: "Do my figures go anywhere?",
        answer: "No. They stay on your computer. We never receive them.",
      },
      {
        question: "A passenger cancels",
        answer: "The ticket is cancelled with its reason, the seat is free again, and the till knows.",
      },
    ],
  },
  /* Written 2026-09-23 for the new trade. For Adel's review before it goes live. */
  general: {
    title: "Sales, stock and reports software for any business | OUAQT",
    description: "Simple software for any business: sales, stock if you have any, expenses, and the day's and month's reports. Coming soon.",
    heading: "Sales, stock and reports, for your business",
    intro: "A salon, a workshop, a service company, a small trader: you sell, you note your expenses, and you see what the day and the month brought in. You keep only what you use.",
    cta: "Build my business's software",
    does: [
      {
        title: "Products and services",
        body: "A haircut, a repair, an item: everything is sold on the same ticket.",
      },
      {
        title: "Stock, if you have any",
        body: "You follow it or you switch it off. The software only shows what you use.",
      },
      {
        title: "Expenses",
        body: "Rent, electricity, wages, recorded with their category.",
      },
      {
        title: "The day's and the month's report",
        body: "What came in, what went out, and what is left.",
      },
      {
        title: "The credit book",
        body: "What each customer owes, and what they have paid.",
      },
      {
        title: "The evening count",
        body: "You count the drawer, the software shows what it expected, and any gap shows at once.",
      },
    ],
    worries: [
      {
        question: "My business is on no list",
        answer: "This is for it. You answer three questions and the software sets itself to your answers.",
      },
      {
        question: "Do my figures go anywhere?",
        answer: "No. They stay on your computer. We never receive them.",
      },
      {
        question: "What if the power cuts?",
        answer: "Each sale is written to the disk before the screen moves on.",
      },
    ],
  },
};
