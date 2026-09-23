import { packRoute } from "@/components/packs/route";

const route = packRoute("transport");

export const generateMetadata = route.generateMetadata;
export default route.Page;
