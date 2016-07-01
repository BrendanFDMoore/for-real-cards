//import { require } from 'meteor/modules'
declare var require:any;
import {PlatformTools} from "../../api/services/platform-tools";
export class CommonPopups {
  private static instance;
  private static init() {
    if (!CommonPopups.instance) {
      // This should happen at build time.  How to???
      if (PlatformTools.isIonic()) {
        CommonPopups.instance = require('../../ui-ionic/common-popups/common-popups.ionic').CommonPopups;
      } else if (PlatformTools.isTWBS()) {
        CommonPopups.instance = require('../../ui-twbs-ng2/common-popups/common-popups.twbs').CommonPopups;
      } else {
        throw "unsupported Platform in CommonPopups";
      }
    }
  }
  static alert(messageOrError, titleText:string="", okText:string="OK"):void {
    CommonPopups.init();
    CommonPopups.instance.alertmessage(messageOrError, titleText, okText)
  }
  static confirm(messageText:string, titleText:string="", okText:string="OK", cancelText:string="Cancel"):Promise<boolean> {
    CommonPopups.init();
    return CommonPopups.instance.confirm(messageText, titleText, okText, cancelText);
  }
}