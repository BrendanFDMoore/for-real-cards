/**
 * Copyright Ken Ono, Fabrica Technolology 2016
 * Source code licensed under GPL 3.0
 */

import { Component, Input } from '@angular/core';

import { RunGame } from './run-game.ts';
import { PlayingCard } from "../playing-card/playing-card";
import { CardImageStyle } from "../api";

@Component(
  {
    selector: 'pile-view',
    directives: [PlayingCard],
    template: `

<playing-card 
  [hidden]="!numberOfCards()"
  [card]="topCardInPile()" 
  [gameId]="gameId"
  [imgStyle]="imgStyle"
  [attr.data-card-rank]="topCardInPile()?.rank"
  [attr.data-card-suit]="topCardInPile()?.suit"
>
</playing-card>      
<label 
  *ngIf="numberOfCards()" 
  class="card-count" 
  style="position: absolute; 10%; top:0%; left:85%; ">
  {{numberOfCards()}}
</label>
<div *ngIf="numberOfCards()===0"  
  style="position: absolute; height:100%; width:100%; border-width: 1px; border-style: solid;border-color: black ">
</div> 

`
  }
)
export class PileView extends RunGame {
  @Input() imgStyle:CardImageStyle;
  @Input() gameId:string;
  numberOfCards():number {
    return this.getCardsInPile() ? this.getCardsInPile().length : 0;
  }
}