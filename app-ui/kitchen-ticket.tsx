import type { Configuration } from "./config";
import { getAppCopy } from "./copy";
import { formatDateTime, formatQuantity, isRightToLeft } from "./format";
import { RECEIPT_WIDTH } from "./receipt";
import { Scaled } from "./scaled";

/*
 * The ticket the kitchen works from.
 *
 * Deliberately not a receipt. No prices, no totals, no shop address: a cook
 * reading it across a hot room needs the table, the time and the dishes, in
 * large type, and nothing else competing for the glance.
 */

export type KitchenLine = {
  id: string;
  name: string;
  quantity: number;
  note?: string;
};

export function KitchenTicket({
  configuration,
  table,
  lines,
  at,
  orderNumber = 1,
}: {
  configuration: Configuration;
  /** Null for a takeaway or a delivery. */
  table: number | null;
  lines: KitchenLine[];
  at?: Date;
  orderNumber?: number;
}) {
  const language = configuration.language.app;
  const copy = getAppCopy(language);
  const rtl = isRightToLeft(language);
  const when = at ?? new Date();

  return (
    <Scaled width={RECEIPT_WIDTH}>
      <div
        dir={rtl ? "rtl" : "ltr"}
        style={{
          width: RECEIPT_WIDTH,
          background: "#fff",
          color: "#000",
          padding: "28px 24px",
          fontFamily: rtl
            ? 'var(--font-arabic), "Noto Naskh Arabic", serif'
            : '"Courier New", ui-monospace, monospace',
          fontSize: 26,
          lineHeight: 1.4,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 34, fontWeight: 700 }}>
          <span>
            {table === null ? copy.tables.takeaway : `${copy.tables.table} ${table}`}
          </span>
          <span>
            <bdi dir="ltr">{String(orderNumber).padStart(3, "0")}</bdi>
          </span>
        </div>

        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <bdi dir="ltr">{formatDateTime(when, language)}</bdi>
        </div>

        <div aria-hidden style={{ borderTop: "3px dashed #000", margin: "14px 0" }} />

        {lines.map((line) => (
          <div key={line.id} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 16, fontSize: 32, fontWeight: 700 }}>
              <span style={{ minWidth: 60 }}>
                <bdi dir="ltr">{formatQuantity(line.quantity, language)}</bdi>
              </span>
              <span>{line.name}</span>
            </div>
            {line.note ? (
              <div style={{ fontSize: 24, paddingInlineStart: 76 }}>{line.note}</div>
            ) : null}
          </div>
        ))}
      </div>
    </Scaled>
  );
}
