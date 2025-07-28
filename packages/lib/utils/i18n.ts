export const i18n = (slug: string) => {
  switch (slug) {
    case "create_game":
      return "Create Game";
    default:
      console.error(`unknown slug: ${slug}`);
      return slug;
  }
};
