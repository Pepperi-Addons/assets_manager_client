import { Component, OnInit } from '@angular/core';
import {  TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'addon-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {
    constructor(
        public translate: TranslateService
    ) {
    }
}
