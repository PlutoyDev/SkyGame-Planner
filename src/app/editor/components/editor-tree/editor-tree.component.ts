import { Component, OnInit } from '@angular/core';
import moment from 'moment';
import { nanoid } from 'nanoid';
import { NodeHelper } from 'src/app/helpers/node-helper';
import { IItem, ItemType } from 'src/app/interfaces/item.interface';
import { INode } from 'src/app/interfaces/node.interface';
import { ISpiritTree } from 'src/app/interfaces/spirit-tree.interface';
import { ISpirit, SpiritType } from 'src/app/interfaces/spirit.interface';
import { ITravelingSpirit } from 'src/app/interfaces/traveling-spirit.interface';
import { DataJsonService } from 'src/app/services/data-json.service';
import { DataService } from 'src/app/services/data.service';

interface IFormNode {
  nw?: boolean;
  n?: boolean;
  ne?: boolean

  item?: string;

  c?: number;
  h?: number;
  ac?: number;
}

@Component({
  selector: 'app-editor-tree-spirit',
  templateUrl: './editor-tree.component.html',
  styleUrls: ['./editor-tree.component.less']
})
export class EditorTreeComponent implements OnInit {
  itemOptions = new Array<IItem>();

  formNodes: Array<IFormNode>;

  result?: ISpiritTree;

  constructor(
    private readonly dataService: DataService,
    private readonly dataJsonService: DataJsonService
  ) {
      this.formNodes = [];
      for (let i = 0; i < 24; i++) { this.formNodes.push({
        n: !((i+2) % 3)
      }); }
  }

  ngOnInit(): void {
    this.formNodes.forEach(n => n.item = undefined);

    this.itemOptions = [];

    // Add items
    this.itemOptions.push(...this.dataService.itemConfig.items);

    // Create new items
    this.itemOptions.push({ guid: 'DON\'T PICK', name: '-- NEW ITEMS --', type: ItemType.Special });
    this.itemOptions.push(this.createWingBuff());
    this.itemOptions.push(this.createHeart());
    this.itemOptions.push(this.createBlessing());
    this.itemOptions.push(this.createBlessing());
    this.itemOptions.push(this.createBlessing());
    this.itemOptions.push(this.createBlessing());
  }

  toggleConnection(node: any, direction: string) {
    node[direction] = !node[direction];
  }

  submit(): void {
    const baseNode = this.formNodeToNodes();
    const nodes = NodeHelper.all(baseNode);

    // Create tree
    const tree: ISpiritTree = {
      guid: nanoid(10),
      node: nodes[0]
    };

    console.log('tree generated', tree);

    this.result = tree;
  }

  copyToClipboard(type: string): void {
    let value = this.getForClipboard(type);
    if (!value) { return; }
    const startI = value.indexOf('{');
    const endI = value.lastIndexOf('}');
    value = value.substring(startI, endI + 1) + ',';
    navigator.clipboard.writeText(value);
  }

  getForClipboard(type: string): string | undefined {
    switch (type) {
      case 'tree':
        return this.dataJsonService.spiritTreesToJson([this.result!]);
      case 'nodes':
        return this.dataJsonService.nodesToJson(NodeHelper.all(this.result!.node));
      case 'items': {
        const nodes = NodeHelper.all(this.result!.node);
        const newItems = nodes
          .filter(n => n.item?.guid && !this.dataService.guidMap.has(n.item.guid))
          .map(n => n.item!);
        return this.dataJsonService.itemsToJson(newItems);
      }
    }
    return undefined;
  }

  getNextThursday(): Date {
    const now = moment();

    now.isoWeekday(4);
    if (now.isoWeek() % 2 === 0) { now.add(7, 'days'); }

    return now.toDate();
  }

  nodeToFormNodes(mainNode: INode): Array<IFormNode> {
    const formNodes = new Array<IFormNode>();

    for (let i = 0; i < 24; i++) {
      formNodes.push({});
    }

    const defineNode = (i: number, node: INode) => {
      formNodes[i] = {
        item: node.item?.guid,
        c: node.c,
        h: node.h,
        ac: node.ac,
        n: !!node.n,
        nw: !!node.nw,
        ne: !!node.ne
      };

      if (node.nw) { defineNode(i - 1, node.nw); }
      if (node.n) { defineNode(i - 3, node.n); }
      if (node.ne) { defineNode(i + 1, node.ne); }
    };

    let i = 22;
    defineNode(i, mainNode);

    return formNodes;
  }

  formNodeToNodes(node?: INode, i = 22): INode {
    const formNode = this.formNodes[i];
    node ??= this.formNodeToNode(formNode)!;
    if (!formNode) { return node; }

    // Left (north-west)
    if (formNode.nw) {
      const j = i - 1;
      const relativeNode = this.formNodeToNode(this.formNodes[j]);
      if (relativeNode) {
        node.nw = relativeNode;
      }
      this.formNodeToNodes(relativeNode, j);
    }

    // Top (north)
    if (formNode.n) {
      const j = i - 3;
      const relativeNode = this.formNodeToNode(this.formNodes[j]);
      if (relativeNode) {
        node.n = relativeNode;
      }
      this.formNodeToNodes(relativeNode, j);
    }

    // Right (north-east)
    if (formNode.ne) {
      const j = i + 1;
      const relativeNode = this.formNodeToNode(this.formNodes[j]);
      if (relativeNode) {
        node.ne = relativeNode;
      }
      this.formNodeToNodes(relativeNode, j);
    }

    return node;
  }

  formNodeToNode(formNode: IFormNode): INode | undefined {
    if (!formNode?.item) { return undefined; }

    return {
      guid: nanoid(10),
      item: this.itemOptions.find(i => i.guid === formNode.item),
      c: formNode.c,
      h: formNode.h,
      ac: formNode.ac
    };
  }

  createHeart(): IItem {
    return {
      guid: nanoid(10),
      type: ItemType.Special,
      name: 'Heart',
      icon: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/d/d9/Heart.png'
    }
  }

  createBlessing(): IItem {
    return {
      guid: nanoid(10),
      type: ItemType.Special,
      name: 'Blessing',
      icon: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/8/8e/5CandlesSpell.png'
    }
  }

  createWingBuff(): IItem {
    return {
      guid: nanoid(10),
      type: ItemType.WingBuff,
      name: 'Wing Buff',
      icon: 'https://static.wikia.nocookie.net/sky-children-of-the-light/images/3/31/Winglight.png'
    }
  }
}
