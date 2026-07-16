import { INGREDIENTS } from '../data/ingredients';

export function drawOrders(state, count) {
  const drawn = [];
  const deck = [...state.deck];

  for (let index = 0; index < count; index += 1) {
    const card = deck.shift();

    if (!card) {
      break;
    }

    drawn.push(card);
  }

  return {
    state: {
      ...state,
      deck,
    },
    drawn,
  };
}

export function cupMatchesOrder(cup, order) {
  const cupCounts = countIngredients(cup);

  return INGREDIENTS.every(
    (ingredient) => (cupCounts[ingredient] ?? 0) === (order.recipe[ingredient] ?? 0),
  );
}

export function countIngredients(ingredients) {
  return ingredients.reduce((counts, ingredient) => {
    counts[ingredient] = (counts[ingredient] ?? 0) + 1;
    return counts;
  }, {});
}

export function findOrderOnTabs(player, orderRef) {
  for (let tabIndex = 0; tabIndex < player.tabs.length; tabIndex += 1) {
    const orderIndex = player.tabs[tabIndex].findIndex((order) => order.id === orderRef);
    if (orderIndex !== -1) {
      return { tabIndex, orderIndex, order: player.tabs[tabIndex][orderIndex] };
    }
  }

  return null;
}
