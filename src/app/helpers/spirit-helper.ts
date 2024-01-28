import { ISpiritTree } from "../interfaces/spirit-tree.interface";
import { ISpirit } from "../interfaces/spirit.interface";
import { DateTime } from 'luxon';

export class SpiritHelper {
  static getTrees(spirit: ISpirit): Array<ISpiritTree> {
    const treeDates: Array<{ date: DateTime, tree: ISpiritTree}> = [];

    // Add all trees that need sorting.
    spirit.ts?.forEach(t => {
      treeDates.push({ date: t.date, tree: t.tree });
    });
    spirit.returns?.forEach(r => {
      treeDates.push({ date: r.return.date, tree: r.tree });
    });

    // Sort TS and revisits by date.
    treeDates.sort((a, b) => {
      if (a.date < b.date) { return -1; }
      if (a.date > b.date) { return 1; }
      return 0;
    });

    // Combine spirit base tree with sorted trees.
    const trees: Array<ISpiritTree> = [];
    if (spirit.tree) { trees.push(spirit.tree); }
    trees.push(...treeDates.map(t => t.tree));

    return trees;
  }
}
