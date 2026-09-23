import { packRoute } from "@/components/packs/route";

const route = packRoute("shop");

export const generateMetadata = route.generateMetadata;
export default route.Page;
