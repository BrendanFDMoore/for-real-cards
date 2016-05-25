import {SimpleSchema} from 'meteor/aldeed:simple-schema';
import {Mongo} from 'meteor/mongo';
import {Meteor} from 'meteor/meteor';
import {Hand, HandCollection} from './hand.model.ts'
import {Card} from './card.model'
import {GameConfig} from './game-config';
import {Deck} from './deck.model';
import * as log from 'loglevel';
import moment = require('moment');
import {AccountTools} from '../../../common/api/services/account-tools';

export let ActionCollection = new Mongo.Collection("actions", {transform: decode});

export enum ActionType {
  RESET,              // 0
  NEW_HAND,           // 1
  DEAL,               // 2
  DECK_TO_HAND,       // 3
  HAND_TO_TABLE,      // 4
  DECK_TO_PILE,       // 5
  HAND_TO_PILE,       // 6
  HAND_SORT,          // 7
  PILE_TO_HAND,       // 8
  PILE_TO_DECK,       // 9
  HAND_TO_DECK,       // 10
  TABLE_TO_HAND,      // 11
  TAKE_TRICK,         // 12
  UNDO                // 13
}

export enum VisibilityType {
  NO_ONE,
  ALL,
  PLAYER
}

export class Action {
  _id:string;
  gameId:string;
  creatorId:string;
  dateCreated:Date;
  actionType:ActionType;
  toPlayerId:string;
  fromPlayerId:string;
  visibilityType:VisibilityType;
  cards:Card[];
  cardsEncoded: string; // Persistence string for cards:Card[]
  gameConfig: GameConfig;
  relatedActionId: string;
  sequencePosition:number;
  sequenceLength:number;
  constructor(initialValues:{
    gameId:string, 
    creatorId:string, 
    actionType:ActionType, 
    toPlayerId?:string,
    fromPlayerId?:string,
    visibilityType?:VisibilityType,
    cards?:Card[],
    gameConfig?:GameConfig,
    relatedActionId?:string
    }) 
  {
    this.gameId = initialValues.gameId;
    this.creatorId = initialValues.creatorId;
    this.actionType = initialValues.actionType;
    this.toPlayerId = initialValues.toPlayerId;
    this.fromPlayerId = initialValues.fromPlayerId;
    this.visibilityType = initialValues.visibilityType;
    this.cards = initialValues.cards || [];
    this.gameConfig = initialValues.gameConfig;
    this.relatedActionId = initialValues.relatedActionId;
  }
}

export class ActionFormatted {
  action:Action;
  constructor(action:Action) {
    this.action = action;
  }
  actionDescription():string {
    return ActionType[this.action.actionType];
  }
  actionTime():string {
    return moment(this.action.dateCreated).format("HH:mm:ss:SSS");
  }
  creator():string {
    return AccountTools.getDisplayName(this.action.creatorId);
  }
  toPlayer():string {
    if (this.action.toPlayerId)
      return AccountTools.getDisplayName(this.action.toPlayerId);
  }
  fromPlayer():string {
    if (this.action.fromPlayerId)
      return AccountTools.getDisplayName(this.action.fromPlayerId);
  }
  visibilityType():string {
    if (this.action.visibilityType)
      return VisibilityType[this.action.visibilityType];
  }
}

let UserCommmandSchema = new SimpleSchema({
  from: {
    type:Number
  },
  to: {
    type:Number
  },
  cardCountAllowed: {
    type: Number
  }
});

let GameConfigSchema = new SimpleSchema({
  name: {
    type: String,
    optional: true
  },
  minimumNumberOfPlayers: {
    type: Number
  },
  maximumNumberOfPlayers: {
    type: Number
  },
  _deck_id: {
    type:Number
  },
  numberOfCardsToPlayer: {
    type: Number
  },
  deckLocationAfterDeal: {
    type: Number
  },
  hasTricks: {
    type: Boolean
  },
  userCommands: {
    type:Array
  },
  "userCommands.$": {
    type: UserCommmandSchema
  }, 
  turnCardUpAfterDeal: {
    type: Boolean,
    optional: true
  },
  seeLastCardOnlyOnFaceUpPile: {
    type:Boolean,
    optional: true
  },
  numberOfCardsToPlayerFaceUp: {
    type: Number,
    optional: true
  }
});

let ActionSchema = new SimpleSchema({
  gameId: {
    type: String
  },
  creatorId: {
    type: String
  },
  dateCreated: {
    type: Date,
    autoValue: function () {
      if (this.isInsert) {
        return new Date();
      }
    },
    denyUpdate: true
  },
  actionType: {
    type: Number
  },
  toPlayerId: {
    type: String,
    optional: true
  },
  fromPlayerId: {
    type: String,
    optional: true
  },
  visibilityType: {
    type: Number,
    optional: true
  },
  cardsEncoded: {
    type: String,
    optional: true
  },
  gameConfig: {
    type: GameConfigSchema,
    optional: true
  },
  relatedActionId: {
    type: String,
    optional: true
  }
});


ActionCollection.allow({
  insert: function (userId, action:Action) {
    return false; // Use method
  },
  update: function (userId, game) {
    return false; // Use method
  },
  remove: function (userId, game) {
    return false; // Use method
  }
});

function encodeCards(cards:Card[]):string {
  let returnValue:string = '';
  cards.forEach((card:Card)=>{
    if (!card) {
      log.error(cards);
      console.trace();
      throw new Meteor.Error('internal-error', 'Card in action is empty');
    }
    returnValue += new Card({rank: card.rank, suit: card.suit}).encode();
  });
  return returnValue;
}

function decode(action:Action):Action {
  action.cards = [];
  let cardsEncoded:string = action.cardsEncoded;
  if (cardsEncoded) {
    for (let i = 0; i < cardsEncoded.length; i = i + 2) {
      let cardCode = cardsEncoded.substr(i, 2);
      let card:Card = new Card({code: cardCode});
      action.cards.push(card);
    }
  }
  if (action.gameConfig) {
    action.gameConfig = new GameConfig(action.gameConfig);
  }
  return action;
}

function checkUser(gameId:string, userId:string) {
  let hand = HandCollection.findOne({gameId: gameId, userId: userId});
  if (!hand) {
    throw new Meteor.Error('user-hand-not-found', 'gameId "' + gameId + '" was not found for current user (' + userId + ')');
  }
}

function addAction(action:Action, userId:string):string {
  if (action.creatorId !== userId)
    throw new Meteor.Error('invalid-user', 'current userId does not match user ID of passed object');
  checkUser(action.gameId, action.creatorId);
  action.cardsEncoded = encodeCards(action.cards);
  if (action.gameConfig) {
    action.gameConfig._deck_id = action.gameConfig.deck.id;
  }
  return ActionCollection.insert(action);
}

if (Meteor.isServer) {
  Meteor.methods(
    {
      'fastcards.NewAction': function(action:Action) {
        addAction(action, this.userId);
      },
      'fastcards.NewActions': function(actions:Action[]) {
        let action:Action = actions[0];
        let groupId = addAction(action, this.userId);
        for (let i=1; i<actions.length; i++) {
          action = actions[i];
          action.relatedActionId = groupId;
          addAction(action, this.userId);
        }
      }
    }
  );
}

ActionCollection.attachSchema(ActionSchema);
//ActionUndoCollection.attachSchema(ActionSchema);

