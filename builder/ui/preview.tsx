"use client";

import { useMemo, useState } from "react";
import {
  Receipt,
  SaleScreen,
  configurationSchema,
  defaultConfiguration,
  sampleProducts,
  sampleSale,
  type AppLanguage,
  type Configuration,
  type Pack,
  type ReceiptLine,
} from "@/app-ui";
import { applyAnswers } from "@/builder/packs/bank";
import { interviewFor } from "@/builder/packs";
import type { BuilderCopy } from "@/builder/copy";
import type { DraftAnswers } from "@/builder/draft/store";
import { cn } from "@/lib/utils";

/*
 * His own software, while he is still describing it.
 *
 * Everything shown here comes from what he has answered so far, filled in
 * with the defaults every unanswered question would take. That is deliberate:
 * the preview is the same configuration the app will run on, not a drawing of
 * one.
 */

export function configurationFrom(
  answers: DraftAnswers,
  fallbackLanguage: AppLanguage
): Configuration {
  const pack: Pack = answers.pack ?? "pharmacy";
  const start = defaultConfiguration(pack, answers.appLanguage ?? fallbackLanguage);

  /*
   * The interview's answers, then anything the AI worked out from a sentence
   * he wrote. The AI's part comes last because the server has already
   * validated it against the schema, so it is the more considered of the two.
   */
  const answered = applyAnswers(start, interviewFor(pack), answers.interview ?? {});
  const patched = answers.patched
    ? {
        ...answered,
        common: (answers.patched.common ?? answered.common) as typeof answered.common,
        features: (answers.patched.features ?? answered.features) as typeof answered.features,
      }
    : answered;

  const base = configurationSchema.safeParse({
    ...patched,
    business: { ...patched.business, nameLatin: "x" },
  }).success
    ? patched
    : answered;

  return {
    ...base,
    language: {
      builder: answers.builderLanguage ?? fallbackLanguage,
      app: answers.appLanguage ?? answers.builderLanguage ?? fallbackLanguage,
    },
    business: {
      nameLatin: answers.nameLatin?.trim() || "",
      nameArabic: answers.nameArabic?.trim() || undefined,
      phone: answers.phone?.trim() || undefined,
      address: answers.address?.trim() || undefined,
      logo: answers.logo,
      logoMono: answers.logoMono,
    },
  };
}

export function Preview({
  copy,
  answers,
  fallbackLanguage,
}: {
  copy: BuilderCopy;
  answers: DraftAnswers;
  fallbackLanguage: AppLanguage;
}) {
  const [tab, setTab] = useState<"sale" | "receipt">("receipt");
  const configuration = useMemo(
    () => configurationFrom(answers, fallbackLanguage),
    [answers, fallbackLanguage]
  );
  const [ticket, setTicket] = useState<ReceiptLine[] | null>(null);

  const products = sampleProducts(configuration.pack);
  const lines: ReceiptLine[] =
    ticket && ticket.length > 0
      ? ticket
      : sampleSale(configuration.pack).map(({ product, quantity }) => ({
          id: product.id,
          name: product.name[configuration.language.app],
          quantity,
          unitPrice: product.price,
        }));

  return (
    <div className="flex h-full flex-col">
      <div role="tablist" className="flex gap-2 border-b border-border px-2">
        <PreviewTab
          selected={tab === "receipt"}
          onClick={() => setTab("receipt")}
        >
          {copy.preview.receipt}
        </PreviewTab>
        <PreviewTab selected={tab === "sale"} onClick={() => setTab("sale")}>
          {copy.preview.sale}
        </PreviewTab>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4">
        {tab === "receipt" ? (
          <div className="mx-auto max-w-[360px] shadow-sm">
            <Receipt configuration={configuration} lines={lines} />
          </div>
        ) : (
          <div className="mx-auto h-full max-w-[720px] overflow-hidden rounded-lg border border-border">
            <SaleScreen
              configuration={configuration}
              products={products}
              onTicketChange={setTicket}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewTab({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={cn(
        "min-h-[48px] px-4 text-base",
        selected
          ? "border-b-2 border-foreground font-medium text-foreground"
          : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
