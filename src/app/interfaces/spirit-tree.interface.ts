import { IConfig, IGuid } from "./base.interface";
import { INode } from "./node.interface";
import { IReturningSpirit } from "./returning-spirits.interface";
import { ISpirit } from "./spirit.interface";
import { ITravelingSpirit } from "./traveling-spirit.interface";

export interface ISpiritTreeConfig extends IConfig<ISpiritTree> {}

export interface ISpiritTree extends IGuid {
  /// References ///
  node: INode;
  ts?: ITravelingSpirit;
  visit?: IReturningSpirit;
  spirit?: ISpirit;
}
