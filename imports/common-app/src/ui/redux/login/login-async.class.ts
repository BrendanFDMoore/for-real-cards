import { Injectable } from '@angular/core';
import { IPayloadAction  } from '../action.interface';
import { Observable } from 'rxjs/Observable';
import { Action, Store } from "redux";
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/delay';

import { IDocumentChange } from "../../reactive-data/document-change.interface"
import { LoginActions } from "./login-actions.class";
import {LoginService} from "./login.service";
import {NeverObservableAction} from "../neverObservableAction.class";
import {ILoginAction, ILoginState} from "./login.types"
import {User} from "../../../../../common-app-api/src/api/models/user.model";
import {IAppState} from "../state.interface";

@Injectable()
export class LoginAsync {
  constructor(private loginActions: LoginActions) {}

  checkAutoLogin = (action$: Observable<IPayloadAction>):Observable<Action> => {
    let loginActions:LoginActions = this.loginActions;
    return action$
      .filter(({type}) => {
        return type === LoginActions.CHECK_AUTO_LOGIN
      })
      .flatMap( ({payload}) => {
        if (LoginService.isLoggedIn()) {
          // Yes, we're logged in, so fire off a logged in event
          return Observable.from([LoginActions.loginSuccessFactory(LoginService.user(), LoginService.userId())]);
        }
        return new NeverObservableAction();
      });
  };

  login = (action$: Observable<IPayloadAction>) => {
    return action$
      .filter(({ type }) => type === LoginActions.LOGIN_REQUEST)
      .flatMap(({ payload }) => {
        return Observable
          .fromPromise(
            LoginService.login(payload.credentials)
          )
          .do( (payloadAction:IPayloadAction) => {
            console.log('payloadAction')
            console.log(payloadAction)
            this.loginActions.watchUser();
            LoginService.watchCurrentUser();
          } )
          .catch(error => Observable.of(error));
      });
  };

  logout = (action$: Observable<IPayloadAction>) => {
    return action$.filter(({ type }) => type === LoginActions.LOGOUT_REQUEST)
      .flatMap(({ payload }) => {
        return Observable.fromPromise(
          LoginService.logOut()
        ).catch(error => Observable.of(error));
      });
  };

  saveUser = (action$: Observable<IPayloadAction>) => {
    return action$.filter(({ type }) => type === LoginActions.SAVE_USER_REQUEST)
      .flatMap(({ payload }) => {
        return Observable.fromPromise(
          LoginService.saveUser(payload.user)
        ).catch(error => Observable.of(error));
      });
  };

  watchUser = (action$: Observable<IPayloadAction>, store: Store<IAppState>) => {
    return action$.filter(({ type }) => type === LoginActions.WATCH_USER)
      .flatMap(({ payload }) => {
        LoginService.watchCurrentUser();
        return LoginService
          .createUserObserver(LoginService.userId()).map( (change:IDocumentChange<User>)=>{
            console.log('store.getState() when in watchUser' );
            console.log(store.getState());
            let loginState:ILoginState = store.getState().loginReducer;
            if (loginState.neverLoggedIn) {
              // Never logged in, yet the current user is populated, must be automatic login
              return LoginActions.loginSuccessFactory(change.newDocument, change.newDocument._id);
            } else {
              return LoginActions.changeFactory(change);
            }
          })
          .catch(error => Observable.of(error));
      });
  };
}