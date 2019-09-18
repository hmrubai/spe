import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home.component';
import { HomeResolveService } from './services/home-resolve.service';


const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    children: [
      {
        path: '',
        loadChildren: './dashboard/dashboard.module#DashboardModule',
        resolve: { dashboard: HomeResolveService }
      },
      {
        path: 'inventory',
        loadChildren: './inventory/inventory.module#InventoryModule',
      },
      {
        path: 'sale',
        loadChildren: './sale/sale.module#SaleModule',
        resolve: { companies: HomeResolveService }
      },
      {
        path: 'purchase',
        loadChildren: './purchase/purchase.module#PurchaseModule',
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class HomeRoutingModule { }