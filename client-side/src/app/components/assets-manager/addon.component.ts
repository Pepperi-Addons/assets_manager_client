import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import {  map } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { AddonService } from '.';
import { Observable } from 'rxjs';

import { PepBreadCrumbItem } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { IPepSearchStateChangeEvent } from '@pepperi-addons/ngx-lib/search';
import { IListViewChangeEvent, IPepListSortingOption, IPepListSortingOptionChangeEvent, IPepListView } from '@pepperi-addons/ngx-lib/list';
import { GenericListDataSource } from '../generic-list/generic-list.component';
import { AssetsService, IAsset } from '../../common/assets-service';
import { AddFolderComponent } from '../add-folder/add-folder.component';

@Component({
  selector: 'addon-module',
  templateUrl: './addon.component.html',
  styleUrls: ['./addon.component.scss'],
  providers: [TranslatePipe,AddFolderComponent]
})
export class AddonComponent implements OnInit {

    PepScreenSizeType = PepScreenSizeType;
    screenSize: PepScreenSizeType;
    options: {key:string, value:string}[] = [];
    dataSource$: Observable<any[]>
    displayedColumns = ['Name', 'Description'];
    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    breadCrumbsItems: Array<PepBreadCrumbItem> = [{key: '1', text: 'Main', title: 'Main'},
                                                  {key: '2', text: 'Sub folder', title: 'Sub folder'}];
    isOnPopUp: boolean = false;
    assetsHeaderTitle = '';
    searchString = '';
    searchAutoCompleteValues = [];
    sortingOptions: Array<IPepListSortingOption>;
    views: Array<IPepListView>;
    currentPepViewType: IPepListView;

    assets: Array<IAsset>;

    //json  = JSON.parse('[{"Key":"1", "Type": "folder", "Name":"Avner","Description":"My first folder"}, {"Key":"2", "Type": "folder", "Name":"Avner","Description":"My first folder"},{"Key":"2", "Type": "file", "Name":"Avner","Description":"My first folder"}]');
    constructor(
        public addonService: AddonService,
        public layoutService: PepLayoutService,
        public dialog: PepDialogService,
        public translate: TranslateService,
        public assetsService: AssetsService,
        public addFolder: AddFolderComponent
    ) {

        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
    }
    
    assetsDataSource: GenericListDataSource = {
        getList: async (state) => {
            const desktopTitle = await this.translate.get('SLIDESHOW.HEIGHTUNITS_REM').toPromise();
            this.assetsHeaderTitle = this.translate.instant('GRID.DEFAULT_TITLE');
             //let res: Promise<any[]> = this.json((pages) => {
              let  res =  this.assets.map(asset => ({
                Key: asset.key,
                Thumbnail: asset.thumbnail ? 'file' : 'folder',
                FileName: asset.key,
                Type: asset.mimeType, 
                Description: asset.description  
            }));

            return res;
        },

        getDataView: async () => {
            return {
                Context: {
                    Name: '',
                    Profile: { InternalID: 0 },
                    ScreenSize: 'Landscape'
                },
                Type: 'Grid',
                Title: '',
                Fields: [
                    {
                        FieldID: 'Thumbnail',
                        Type: "Image",
                        Title: this.translate.instant('GRID.COLUMN.THUMBNAIL'),
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: 'FileName',
                        Type: 'TextBox',
                        Title: this.translate.instant('GRID.COLUMN.FILENAME'),
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: 'Type',
                        Type: 'TextBox',
                        Title: this.translate.instant('GRID.COLUMN.TYPE'),
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: 'Description',
                        Type: 'TextBox',
                        Title: this.translate.instant('GRID.COLUMN.DESCRIPTION'),
                        Mandatory: false,
                        ReadOnly: true
                    }
                ],
                Columns: [
                    { Width: 15 },
                    { Width: 25 },
                    { Width: 10 },
                    { Width: 50 },
                ],
                FrozenColumnsCount: 0,
                MinimumColumnWidth: 0
            }
        },

        getActions: async (objs) => {
            let actions = objs.length ? [
                {
                    title: this.translate.instant("Download"),
                    handler: async (objs) => {
                        //this.downloadChart(objs[0]);
                    }
                }
            ] : []
            if (objs.length > 0 && !objs[0]?.ReadOnly) {
                actions.unshift(
                    {
                        title: this.translate.instant("Edit"),
                        handler: async (objs) => {
                            // this.router.navigate([objs[0].Key], {
                            //     state: { data: objs[0] },
                            //     relativeTo: this.route,
                            //     queryParamsHandling: 'merge'
                            // });
                        }
                    },
                    {
                        title: this.translate.instant("Delete"),
                        handler: async (objs) => {
                            // this.deleteChart(objs[0]);
                        }
                    }
                );
            }
            if (objs[0]?.ReadOnly) {
                actions.unshift(
                    {
                        title: this.translate.instant("Preview"),
                        handler: async (objs) => {
                            // this.router.navigate([objs[0].Key], {
                            //     state: { data: objs[0] },
                            //     relativeTo: this.route,
                            //     queryParamsHandling: 'merge'
                            // });
                        }
                    }
                );
            }
            return actions;
        }
    }
    
    ngOnInit(){
        
        this.loadListSorting();
        this.loadViews();
        
    }

    upload(e) {
        const fileListAsArray = Array.from(e);
        fileListAsArray.forEach((item, i) => {
          const file = (e as HTMLInputElement);
          const url = URL.createObjectURL(file[i]);
          //this.imgArr.push(url);
          //this.fileArr.push({ item, url: url });
        });    
    }

    private loadListSorting(): void {
        this.sortingOptions = [
            { sortBy: 'a-z', title: 'A -> Z', isAsc: true },
            { sortBy: 'z-a', title: 'Z -> A', isAsc: false },
            { sortBy: 'index', title: 'Index' },
        ];
    }

    private loadViews(): void {
        this.views = [
            { key: 'card', title: '', iconName: 'view_card_md' },
            { key: 'table', title: '', iconName: 'view_table' }
        ];

        this.currentPepViewType = this.views[0];
    }

    assetURLChange(event){

    }

    buttonClick(event){
        
    }

    onMenuItemClicked(event){
        
    }

    onBreadCrumbItemClick(event){

    }

    onSearchStateChanged(searchStateChangeEvent: IPepSearchStateChangeEvent) {
        // debugger;
    }

    onSearchChanged(search: any) {
        console.log(search);
        // debugger;
    }

    onSearchAutocompleteChanged(value) {
        console.log(value);
        // debugger;
    }

    onSortingChanged(sortingChangeEvent: IPepListSortingOptionChangeEvent) {
        //
    }

    onViewChanged(viewChangeEvent: IListViewChangeEvent) {
        // debugger;
        //this.loadlist(this.dataSource);
    }

    onAddFolderClick(event){
        this.assetsService.openDialog(AddFolderComponent);
        //this.assetsService.openDialogMsg("Add Folder","asdfsdfs",null);
    }
   





}
