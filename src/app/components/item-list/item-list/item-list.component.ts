import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IItemList } from 'src/app/interfaces/item-list.interface';

@Component({
  selector: 'app-item-list',
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemListComponent {
  @Input() itemList!: IItemList;
}
