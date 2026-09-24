import { packRoute } from "@/components/packs/route";

const route = packRoute("warehouse");

export const generateMetadata = route.generateMetadata;
export default route.Page;
