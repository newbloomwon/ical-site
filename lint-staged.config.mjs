export default {
  "(apps|packages|companion)/**/*.{js,ts,jsx,tsx}": (files) =>
    `biome lint --reporter summary --config-path=biome-staged.json ${files
      .map((file) => JSON.stringify(file))
      .join(" ")}`,
  "packages/prisma/schema.prisma": ["prisma format"],
};
