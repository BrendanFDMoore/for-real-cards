/**
 * Copyright Ken Ono, Fabrica Technolology 2016
 * Source code license under Creative Commons - Attribution-NonCommercial 2.0 Canada (CC BY-NC 2.0 CA)
 */

import {IForRealCardsState, IForRealCardsActionPayload} from "./for-real-cards.types";
import {IPayloadAction} from "../../../../common-app";
import {ForRealCardsActions} from "./for-real-cards-actions.class";

export const INITIAL_STATE_FOR_REAL_CARDS = {
  gameDescription: "New Game",
  gameId: null,
  loading: false
};

export function forRealCardsReducer(
  state: IForRealCardsState = INITIAL_STATE_FOR_REAL_CARDS,
  action: IPayloadAction) {

  let payload:IForRealCardsActionPayload = action.payload;
  switch (action.type) {
    case (ForRealCardsActions.JOIN_GAME_REQUEST):
    case (ForRealCardsActions.LOAD_GAME_REQUEST):
    case (ForRealCardsActions.VIEW_GAME_REQUEST):
    {
      return Object.assign({}, state, {loading: true})
    }
    case (ForRealCardsActions.JOIN_GAME_SUCCESS):
    case (ForRealCardsActions.VIEW_GAME_SUCCESS):
    case (ForRealCardsActions.LOAD_GAME_SUCCESS):
    {
      return Object.assign({}, state, {gameDescription: '(id '+ payload.gameId + ')', gameId:payload.gameId, loading:false});
    }
    default:
      return state;
  }
}

