import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorDashboardComponent } from './components/dashboard/editor-dashboard.component';
import { EditorTravelingSpiritComponent } from './components/editor-traveling-spirit/editor-traveling-spirit.component';
import { EditorTreeComponent } from './components/editor-tree/editor-tree.component';
import { EditorShopComponent } from './components/editor-shop/editor-shop.component';
import { EditorItemComponent } from './components/editor-item/editor-item.component';

const routes: Routes = [
  { path: '', component: EditorDashboardComponent },
  { path: 'ts', component: EditorTravelingSpiritComponent },
  { path: 'tree', component: EditorTreeComponent },
  { path: 'shop', component: EditorShopComponent },
  { path: 'item', component: EditorItemComponent },
];

@NgModule({
  declarations: [],
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class EditorRoutingModule { }
