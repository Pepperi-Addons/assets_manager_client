import { ActivatedRoute } from '@angular/router';
import { from, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Component, OnInit } from '@angular/core';
import { PepCustomizationService, PepLoaderService, PepStyleType } from '@pepperi-addons/ngx-lib';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { AssetsService } from './common/assets-service';

declare var CLIENT_MODE: any;

@Component({
    selector: 'addon-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

    footerHeight: number;
    showLoading = false;
    clientMode: string;
    addon$: Observable<any>;
    menuItems: Array<PepMenuItem> = null;


    constructor(
        private assetsService: AssetsService,
        public customizationService: PepCustomizationService,
        public loaderService: PepLoaderService
    ) {
        this.loaderService.onChanged$
            .subscribe((show) => {
                this.showLoading = show;
            });
            this.clientMode = CLIENT_MODE;
    }

    ngOnInit() {
        this.customizationService.setThemeVariables();
        this.customizationService.footerHeight.subscribe(footerHeight => this.footerHeight = footerHeight);
        this.addon$ = from(this.assetsService.get(`/addons/installed_addons`)).pipe(
            map(res => {return res[0]?.Addon}));

        this.menuItems = [];
        this.menuItems.push({
            key: 'ApiName',
            text: 'Title',
            type: 'regular'
        })
    }

    getTopBarStyle() {
        return document.documentElement.style.getPropertyValue(PepCustomizationService.STYLE_TOP_HEADER_KEY) as PepStyleType;
    }

    navigateHome() {
        alert('Home');
    }

    getButtonClassName() {
        return this.getTopBarStyle() === 'strong' ? 'keep-background-on-focus' : 'invert';
    }

    //onMenuItemClicked(event: IPepMenuItemClickEvent) {}

}
