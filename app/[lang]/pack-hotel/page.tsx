import { packRoute } from "@/components/packs/route";

const route = packRoute("hotel");

export const generateMetadata = route.generateMetadata;
export default route.Page;
