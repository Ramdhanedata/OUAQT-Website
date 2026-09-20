import type { Pack } from "@/app-ui/packs";
import commonJson from "./common.v1.json";
import bakeryJson from "./bakery/questions.v1.json";
import pharmacyJson from "./pharmacy/questions.v1.json";
import restaurantJson from "./restaurant/questions.v1.json";
import warehouseJson from "./warehouse/questions.v1.json";
import { questionBank, type Question, type QuestionBank } from "./bank";

/*
 * The question banks, loaded and checked.
 *
 * The JSON is parsed through the schema here rather than trusted, so a hand
 * edit that breaks a bank fails at the first import instead of halfway
 * through an owner's interview.
 *
 * Packs whose banks are not written yet are simply absent. The builder only
 * offers packs that settings mark as open, so a missing bank cannot be
 * reached by an owner.
 */

const raw: Partial<Record<Pack, unknown>> = {
  pharmacy: pharmacyJson,
  bakery: bakeryJson,
  restaurant: restaurantJson,
  warehouse: warehouseJson,
};

export const common: QuestionBank = questionBank.parse(commonJson);

export function packBank(pack: Pack): QuestionBank | null {
  const json = raw[pack];
  return json ? questionBank.parse(json) : null;
}

/**
 * Every question an owner of this pack is asked, in order: his trade's own
 * questions first, then the ones every shop answers.
 */
export function interviewFor(pack: Pack): Question[] {
  const own = packBank(pack);
  return [...(own?.questions ?? []), ...common.questions];
}

export { questionBank, type Question, type QuestionBank };
export * from "./bank";
