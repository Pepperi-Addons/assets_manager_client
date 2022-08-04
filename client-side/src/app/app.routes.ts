import { NgModule } from '@angular/core';
import { Component } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AssetsComponent } from './addon/addon.component';

// Important for single spa
@Component({
    selector: 'app-empty-route',
    template: '<div></div>',
})
export class EmptyRouteComponent {}

const routes: Routes = [
    // {
    //     path: `settings/:addon_uuid`,
    //     children: [
    //         {
    //             path: ':editor',
    //             component: AssetsComponent
    //             // TODO: solve routing
    //             // path: '**',
    //             // loadChildren: () => import('./addon/addon.module').then(m => m.AssetsModule)
    //         }
    //     ]
    // },
    {
        path: ':settingsSectionName/:addonUUID/:slugName',
        loadChildren: () => import('./addon/addon.module').then(m => m.AssetsModule),
    },
    {
        path: '**',
        component: EmptyRouteComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }



