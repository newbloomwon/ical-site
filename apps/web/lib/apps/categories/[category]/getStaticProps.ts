import { getAppRegistry } from "@calcom/app-store/_appRegistry";
import type { AppCategories } from "@calcom/prisma/enums";

export type CategoryDataProps = NonNullable<Awaited<ReturnType<typeof getStaticProps>>>;

export const getStaticProps = async (
  category: AppCategories
): Promise<{ apps: Awaited<ReturnType<typeof getAppRegistry>>; category: AppCategories }> => {
  const appStore = await getAppRegistry();
  const apps = appStore.filter((app) => app.categories?.includes(category));
  return {
    apps,
    category,
  };
};
