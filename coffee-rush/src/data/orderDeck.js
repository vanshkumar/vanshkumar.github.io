import rawOrders from '../../data/orderDeck.csv?raw';
import { parseCsv } from './csv';
import { INGREDIENTS } from './ingredients';

export const ORDER_DECK = parseCsv(rawOrders).map((row) => {
  const recipe = {};

  for (const ingredient of INGREDIENTS) {
    const count = Number(row[ingredient]);
    if (count > 0) {
      recipe[ingredient] = count;
    }
  }

  return {
    id: row.instance_id,
    deckPos: Number(row.deck_pos),
    name: row.name,
    isSpecialty: row.is_specialty === 'true',
    recipe,
  };
});
