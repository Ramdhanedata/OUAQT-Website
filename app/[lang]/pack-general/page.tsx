import { packRoute } from "@/components/packs/route";

const route = packRoute("general");

export const generateMetadata = route.generateMetadata;
export default route.Page;
