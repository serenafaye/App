import {NavParams, Nav, LoadingController} from 'ionic-angular';
import {Component} from '@angular/core';
import { DomSanitizationService } from '@angular/platform-browser';
import {Geolocation} from 'ionic-native';


@Component({
    templateUrl: 'build/pages/iframe/index.html'
})
export default class {

    title: string;
    url: any;
    iframe: any;
    param: string;
    loaded: boolean = false;
    constructor(private navParams: NavParams, private loadingController: LoadingController, private sanitizer: DomSanitizationService) {
        this.title = navParams.data.title;

        if ( navParams.data.url.indexOf('?') >= 0 ) {
            this.param = '&appp=2';
        } else {
            this.param = '?appp=2';
        }

        this.url = this.sanitizer.bypassSecurityTrustResourceUrl( navParams.data.url + this.param );
        
        console.log('navParams.data', navParams.data);

    }

    ionViewWillEnter() {
        this.iframeLoading();
    }

    iframeLoading() {

        console.log('loaded' + this.loaded);

        // set this.loaded so cached pages don't show loading spinner
        if( this.loaded )
            return;

        let loading = this.loadingController.create({
            showBackdrop: false,
            dismissOnPageChange: false
        });

        loading.present(loading);

        // When WP site loads, attach our click events
        window.addEventListener('message', (e) => {

            console.log('iframe listener');

            if(e.data === 'site_loaded') {
                loading.dismiss();
            } else if( e.data === 'reload_frame' ) {
                // need to reload frame on login
                this.findIframe();
                let src = this.iframe.src;
                this.iframe.src = src;
            }
        });

        setTimeout(() => {
            loading.dismiss();
        }, 9000);

        this.loaded = true;
    }

    findIframe() {

        /* 
         Ionic stacks cached views on top of each other, which causes duplicate ids on the page. We need to find the active page in the stack, and send our post messages there. Otherwise message is sent to the wrong page.
        */

        let pages = document.getElementsByTagName('ion-page');
        let lengths = pages.length;

        if( lengths > 1 ) {
            console.log('finding in stack...');
            // find the active page, last one on page
            let index = lengths - 1;
            let lastpage = pages[index];

            console.log( lastpage );

            this.iframe = lastpage.getElementsByClassName('ap3-iframe')[0];

            console.log( this.iframe );

        } else {
            console.log('only one view');
            // we don't have any cached views, so don't have to run this
            this.iframe = (<any>document.getElementById('ap3-iframe'));
        }

    }

    activityModal() {

        this.findIframe();

        this.iframe.contentWindow.postMessage('activity', '*');
    }
    checkinModal() {

        this.findIframe();

        // first message is to show modal, then we send through location
        this.iframe.contentWindow.postMessage('checkin', '*');

        // Do this when checkin button clicked
        Geolocation.getCurrentPosition().then((position) => {

            let latitude = position.coords.latitude;
            let longitude = position.coords.longitude;

            console.log('position', position);
            // need to postmessage this
            this.iframe.contentWindow.postMessage({ lat: latitude, long: longitude }, '*');

        });
    }
}
