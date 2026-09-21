import { packRoute } from "@/components/packs/route";

const route = packRoute("bakery");

export const generateMetadata = route.generateMetadata;
export default route.Page;
