import { packRoute } from "@/components/packs/route";

const route = packRoute("restaurant");

export const generateMetadata = route.generateMetadata;
export default route.Page;
