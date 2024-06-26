import { Routes } from '@angular/router';
import { EditorDashboardComponent } from './components/dashboard/editor-dashboard.component';
import { EditorTravelingSpiritComponent } from './components/editor-traveling-spirit/editor-traveling-spirit.component';
import { EditorTreeComponent } from './components/editor-tree/editor-tree.component';
import { EditorShopComponent } from './components/editor-shop/editor-shop.component';
import { EditorItemComponent } from './components/editor-item/editor-item.component';
import { EditorOrderComponent } from './components/editor-order/editor-order.component';
import { EditorEventInstanceComponent } from './components/editor-event-instance/editor-event-instance.component';
import { EditorTodoComponent } from './components/editor-todo/editor-todo.component';

export const routes: Routes = [
  { path: '', component: EditorDashboardComponent },
  { path: 'todo', component: EditorTodoComponent },
  { path: 'ts', component: EditorTravelingSpiritComponent },
  { path: 'tree', component: EditorTreeComponent },
  { path: 'shop', component: EditorShopComponent },
  { path: 'item', component: EditorItemComponent },
  { path: 'order', component: EditorOrderComponent },
  { path: 'event-instance', component: EditorEventInstanceComponent },
];
