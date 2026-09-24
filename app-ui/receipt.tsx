import type { AppLanguage, Configuration } from "./config";
import { getAppCopy } from "./copy";
import {
  formatAmount,
  formatDateTime,
  formatMoney,
  formatQuantity,
  isRightToLeft,
} from "./format";
import { lineTotal, sum } from "./money";
import { Scaled } from "./scaled";

/*
 * The 80mm receipt, drawn the width it prints: 576 pixels at 203 dpi.
 *
 * Black on white only, because that is all a thermal printer can do. The
 * black and white logo is used here, never the colour one, for the same
 * reason.
 */

export const RECEIPT_WIDTH = 576; // not-a-rule: 80mm at 203 dpi

/*
 * A receipt should look typed, so Latin text is monospaced. Arabic cannot be:
 * Courier New carries isolated Arabic glyphs but does not join them, so the
 * browser picks it, and the shop's name comes out as loose letters. Arabic
 * therefore asks for a shaping font first and falls back to whatever the
 * system has.
 */
const ARABIC_FONT = 'var(--font-arabic), "Noto Naskh Arabic", "Geeza Pro", serif';
const LATIN_FONT = '"Courier New", ui-monospace, monospace';

function receiptFont(language: AppLanguage): string {
  return language === "ar" ? ARABIC_FONT : LATIN_FONT;
}

export type ReceiptLine = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export function Receipt({
  configuration,
  lines,
  number = 1,
  at,
}: {
  configuration: Configuration;
  lines: ReceiptLine[];
  number?: number;
  at?: Date;
}) {
  const language = configuration.language.app;
  const copy = getAppCopy(language);
  const rtl = isRightToLeft(language);
  const { business, receipt } = configuration;
  /*
   * The preview draws itself in the browser, so today's date is safe here:
   * nothing is rendered on the server that a client render could disagree
   * with. An owner looking at 01/01/1970 on his own receipt does not think
   * "sensible default", he thinks the thing is broken.
   */
  const when = at ?? new Date();
  const total = sum(lines.map((l) => lineTotal(l.quantity, l.unitPrice)));

  return (
    <Scaled width={RECEIPT_WIDTH}>
      <div
        dir={rtl ? "rtl" : "ltr"}
        style={{
          width: RECEIPT_WIDTH,
          background: "#fff",
          color: "#000",
          padding: "32px 28px",
          fontFamily: receiptFont(language),
          fontSize: 22,
          lineHeight: 1.45,
        }}
      >
        {receipt.showLogo && business.logoMono ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logoMono}
            alt=""
            style={{
              display: "block",
              margin: "0 auto 16px",
              maxHeight: 140,
              maxWidth: "70%",
            }}
          />
        ) : null}

        <div style={{ textAlign: "center", fontSize: 30, fontWeight: 700 }}>
          {business.nameLatin}
        </div>
        {business.nameArabic ? (
          <div
            style={{
              textAlign: "center",
              fontSize: 26,
              fontFamily: ARABIC_FONT,
            }}
            dir="rtl"
          >
            {business.nameArabic}
          </div>
        ) : null}
        {receipt.showPhone && business.phone ? (
          <div style={{ textAlign: "center" }}>
            <bdi dir="ltr">{business.phone}</bdi>
          </div>
        ) : null}
        {receipt.showAddress && business.address ? (
          <div style={{ textAlign: "center" }}>{business.address}</div>
        ) : null}

        <Rule />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>
            {copy.receipt.number} <Ltr>{String(number).padStart(4, "0")}</Ltr>
          </span>
          <span>
            <Ltr>{formatDateTime(when, language)}</Ltr>
          </span>
        </div>

        <Rule />

        {lines.map((line) => (
          <div key={line.id} style={{ marginBottom: 10 }}>
            <div>{line.name}</div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                <Ltr>
                  {formatQuantity(line.quantity, language)} x{" "}
                  {formatAmount(line.unitPrice, language)}
                </Ltr>
              </span>
              <span>
                <Ltr>{formatAmount(lineTotal(line.quantity, line.unitPrice), language)}</Ltr>
              </span>
            </div>
          </div>
        ))}

        <Rule />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          <span>{copy.receipt.total}</span>
          <span>
            <Ltr>{formatMoney(total, language)}</Ltr>
          </span>
        </div>

        <Rule />

        <div style={{ textAlign: "center" }}>
          {receipt.footer || copy.receipt.thanks}
        </div>
      </div>
    </Scaled>
  );
}

/*
 * Numbers, dates and the currency are read left to right even on an Arabic
 * receipt. Without isolating them the browser reorders the pieces, and a
 * total of 640,00 MRU prints as MRU 640,00 while "2 x 120,00" comes out
 * backwards. `bdi` keeps each run whole without touching the words around it.
 */
function Ltr({ children }: { children: React.ReactNode }) {
  return <bdi dir="ltr">{children}</bdi>;
}

function Rule() {
  return (
    <div
      aria-hidden
      style={{
        borderTop: "2px dashed #000",
        margin: "14px 0",
      }}
    />
  );
}
