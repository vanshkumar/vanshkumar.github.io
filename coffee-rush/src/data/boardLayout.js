import rawBoard from '../../data/boardLayout.csv?raw';
import { parseCsv } from './csv';

export const BOARD_CELLS = parseCsv(rawBoard).map((row) => ({
  row: Number(row.row),
  col: Number(row.col),
  id: Number(row.cell_id),
  ingredient: row.ingredient,
  isCorner: row.is_corner === 'true',
  isSpecialty: row.is_specialty === 'true',
}));

export const BOARD_BY_ID = Object.fromEntries(
  BOARD_CELLS.map((cell) => [cell.id, cell]),
);
