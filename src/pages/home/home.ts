import { Media, MediaObject } from '@ionic-native/media';
import { File, Entry } from '@ionic-native/file';
import { Component } from '@angular/core';
import { NavController, Platform, Loading, LoadingController, ToastController, AlertController } from 'ionic-angular';

const RECORD_STATUS_START = 0x000f;
const RECORD_STATUS_STOP = RECORD_STATUS_START + 1;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  btn_action_name = '开始录音';
  fileList: Array<MediaFile> = [];

  filePath: string = '';

  currentFile: MediaObject = null;
  recordStatus;

  myLoading: Loading;
  isLoadingShow: boolean = false;

  constructor(public navCtrl: NavController,
    private media: Media,
    private file: File,
    private plaftform: Platform,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    this.recordStatus = RECORD_STATUS_START;

  }

  ionViewDidLoad() {
    this.plaftform.ready().then(() => {
      let isAndroid = this.plaftform.is('android');
      this.filePath = isAndroid ? this.file.externalRootDirectory : this.file.documentsDirectory;
      console.log("File Path:" + this.filePath);
      this.getFileList();
    })
  }

  getFileList() {
    this.fileList = [];
    this.file.listDir(this.filePath, 'hank-test').then(data => {

      for (let index in data) {
        let item = data[index];
        if (item) {
          if (item.isFile) {
            let mediaFile = new MediaFile();
            mediaFile.name = item.name;
            mediaFile.path = item.nativeURL;
            let time = item.name.substring(0, item.name.lastIndexOf("."));
            mediaFile.time = mediaFile.formatDateYYYYMMDDHHMM(Number(time));
            this.fileList.push(mediaFile);
          }
        }
      }
      console.log('file list:' + JSON.stringify(this.fileList));
    }).then(error => {
      console.log('get File list fail:' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
    });
  }

  onItemClicked(item: Entry) {
    let alert = this.alertCtrl.create({
      title: '提示',
      subTitle: '请选择您的操作?',
      buttons: [
        {
        text: '删除',
        handler: data=> {

          this.file.removeFile(this.filePath+'hank-test', item.name).then(result=>{
            console.log('delete file:' + JSON.stringify(result));
          }).catch(error=>{
            console.log('get File list fail:' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
          });
          this.getFileList();
        }
      },
      {
        text:'播放',
        handler:data=>{
          let filepath = item.nativeURL.replace(/^file:\/\//, '');
          let mediaFile = this.media.create(filepath);
          console.log('Play file:' + JSON.stringify(mediaFile));
          mediaFile.onSuccess.subscribe(()=>{
            console.log('file played:' + JSON.stringify(item.name));
          })
          mediaFile.play();
        },
        role:'cancel'
      },

      {
        text: '取消',
        role:'cancel'
      }
      ]
    });
    alert.present();
  }


  onBtnClicked() {

    if (this.recordStatus == RECORD_STATUS_START) {
      this.recordStatus = RECORD_STATUS_STOP;
      this.btn_action_name = '保存录音';
      let time = new Date().getTime();
      this.file.resolveDirectoryUrl(this.filePath).then(path => {
        this.file.getDirectory(path, 'hank-test', { create: true, exclusive: false }).then(directory => {
          this.file.getFile(directory, time + '.3gp', { create: true, exclusive: false }).then(file => {
            console.log('create file path:' + JSON.stringify(file));
            let filepath = file.nativeURL.replace(/^file:\/\//, '');
            this.currentFile = this.media.create(filepath);
            console.log('record path:' + filepath);
            this.currentFile.startRecord();
            this.showToast('录音开始...');
          }).catch((error) => {
            console.log('File create fail:' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
          });
        }).catch(error => {
          console.log('Directory fail:' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
        })
      }).catch(error => {
        console.log('Resovle fail:' + JSON.stringify(error, Object.getOwnPropertyNames(error)));
      });

    } else {
      if (this.currentFile) {
        this.currentFile.stopRecord();
      }
      this.showToast('录音已停止');
      this.recordStatus = RECORD_STATUS_START;
      this.btn_action_name = '开始录音';
      setTimeout(() => {
        this.getFileList();
      }, 1000);

    }
  }

  private createLoading() {
    if (this.myLoading == null) {
      this.myLoading = this.loadingCtrl.create({
        spinner: 'crescent',
        enableBackdropDismiss: true
      });
    }
  }


  showLoading(msg: string) {
    if (this.myLoading == null) {
      this.createLoading();
    }
    if (!this.isLoadingShow) {
      this.myLoading.setContent(msg);
      this.myLoading.present();
      this.isLoadingShow = true;
    }
  }

  dismissLoading() {
    if (this.myLoading != null) {
      this.myLoading.dismiss();
      this.myLoading = null;
      this.isLoadingShow = false;
    }
  }

  showToast(msg: string, duration?: number, onDismiss?: () => void) {
    let toast = this.toastCtrl.create({
      message: msg,
      position: 'middle',
      duration: duration ? duration : 2500
    });
    if (onDismiss) {
      toast.onDidDismiss(onDismiss);
    }
    toast.present();
  }

}

class MediaFile {

  public name: string = '';
  public path: string = '';
  public time: string = '';

  constructor() {

  }

  /**
 * 转换时间格式为YYYY-MM-DD HH:mm
 */
  formatDateYYYYMMDDHHMM(time: number): string {
    const Dates = new Date(time);
    const year: number = Dates.getFullYear();
    const month: any = (Dates.getMonth() + 1) < 10 ? '0' + (Dates.getMonth() + 1) : (Dates.getMonth() + 1);
    const day: any = Dates.getDate() < 10 ? '0' + Dates.getDate() : Dates.getDate();
    const HH: any = Dates.getHours() < 10 ? '0' + Dates.getHours() : Dates.getHours();
    const mm: any = Dates.getMinutes() < 10 ? '0' + Dates.getMinutes() : Dates.getMinutes();
    const result = year + '-' + month + '-' + day + " " + HH + ":" + mm;
    return result;
  }

}
