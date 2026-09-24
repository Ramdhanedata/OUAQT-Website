import { packRoute } from "@/components/packs/route";

const route = packRoute("pharmacy");

export const generateMetadata = route.generateMetadata;
export default route.Page;
