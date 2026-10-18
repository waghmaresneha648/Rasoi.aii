import recipes from "./recipes.json";

function searchRecipes(query) {
  query = query.toLowerCase();

  return recipes.filter((recipe) => {
    // Check name
    if (recipe.name.toLowerCase().includes(query)) {
      return true;
    }

    // Check tags
    if (recipe.tags.some(tag =>
      tag.toLowerCase().includes(query)
    )) {
      return true;
    }

    // Check ingredients
    if (recipe.ingredients.some(ing =>
      ing.toLowerCase().includes(query)
    )) {
      return true;
    }

    return false;
  });
}

export default searchRecipes;