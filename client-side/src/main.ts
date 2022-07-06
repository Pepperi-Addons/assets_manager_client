// import { enableProdMode, NgZone } from '@angular/core';
// import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
// import { Router } from '@angular/router';
// import { singleSpaAngular, getSingleSpaExtraProviders } from 'single-spa-angular';
// import { AppModule } from './app/app.module';
// import { environment } from './environments/environment';
// import { singleSpaPropsSubject } from './single-spa-props';

// if (environment.production) {
//     enableProdMode();
// }

// let lifecycles = singleSpaAngular({
//     bootstrapFunction: singleSpaProps => {
//         singleSpaPropsSubject.next(singleSpaProps);
//         return platformBrowserDynamic(getSingleSpaExtraProviders()).bootstrapModule(AppModule);
//     },
//     template: '<addon-root />',
//     Router,
//     NgZone
// });

// export const bootstrap = lifecycles.bootstrap;
// export const mount = lifecycles.mount;
// export const unmount = lifecycles.unmount;

import('./bootstrap').catch(err => console.error(err));