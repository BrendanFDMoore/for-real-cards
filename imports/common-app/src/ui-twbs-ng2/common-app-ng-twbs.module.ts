import { NgModule }      from '@angular/core';
import { CommonModule }      from '@angular/common';
import { CommonAppNg, COMMON_APP_NG_EXPORTS } from "../ui-ng2";
import { Avatar } from "./avatar/avatar";
import { ModalDialog } from "./modal/modal.component";
import { PopoverMenu } from "./popover-menu/popover-menu";

export const COMMON_APP_NB_TWBS_EXPORTS = [Avatar, ModalDialog, PopoverMenu];

@NgModule({
  imports: [CommonModule, CommonAppNg],
  declarations: [...COMMON_APP_NB_TWBS_EXPORTS],
  exports: [...COMMON_APP_NB_TWBS_EXPORTS, ...COMMON_APP_NG_EXPORTS]
})
export class CommonAppNgTWBS {

}