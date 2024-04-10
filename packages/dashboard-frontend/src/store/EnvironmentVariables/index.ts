import { CoreV1Event } from '@kubernetes/client-node';
import { AppThunk } from '@/store';
import { api, helpers } from '@eclipse-che/common';
import { AUTHORIZED, SanityCheckAction } from '@/store/sanityCheckMiddleware';
import { selectAsyncIsAuthorized, selectSanityCheckError } from '@/store/SanityCheck/selectors';
import { selectDefaultNamespace } from '@/store/InfrastructureNamespaces/selectors';
import { Action, Reducer } from 'redux';
import {
  addEnvironmentVariable,
  fetchEnvironmentVariables, removeEnvironmentVariable, updateEnvironmentVariable,
} from '@/services/backend-client/environmentVariableApi';
import { provisionKubernetesNamespace } from '@/services/backend-client/kubernetesNamespaceApi';
import { createObject } from '@/store/helpers';

export interface State {
  isLoading: boolean;
  environmentVariables: api.EnvironmentVariable[];
  error?: string;
}

export enum Type {
  RECEIVE_ERROR = 'RECEIVE_ERROR',
  RECEIVE_ENVIRONMENT_VARIABLES = 'RECEIVE_ENVIRONMENT_VARIABLES',
  REQUEST_ENVIRONMENT_VARIABLES = 'REQUEST_ENVIRONMENT_VARIABLES',
  ADD_ENVIRONMENT_VARIABLE = 'ADD_ENVIRONMENT_VARIABLE',
  UPDATE_ENVIRONMENT_VARIABLE = 'UPDATE_ENVIRONMENT_VARIABLE',
  REMOVE_ENVIRONMENT_VARIABLE = 'REMOVE_ENVIRONMENT_VARIABLE',
}

export interface RequestEnvironmentVariablesAction extends Action, SanityCheckAction {
  type: Type.REQUEST_ENVIRONMENT_VARIABLES;
}

export interface ReceiveEnvironmentVariablesAction extends Action {
  type: Type.RECEIVE_ENVIRONMENT_VARIABLES;
  environmentVariables: api.EnvironmentVariable[];
}

export interface AddEnvironmentVariableAction extends Action {
  type: Type.ADD_ENVIRONMENT_VARIABLE;
  environmentVariable: api.EnvironmentVariable;
}

export interface UpdateEnvironmentVariableAction extends Action {
  type: Type.UPDATE_ENVIRONMENT_VARIABLE;
  environmentVariable: api.EnvironmentVariable;
}

export interface RemoveEnvironmentVariableAction extends Action {
  type: Type.REMOVE_ENVIRONMENT_VARIABLE;
  environmentVariable: api.EnvironmentVariable;
}

export interface ReceiveErrorAction extends Action {
  type: Type.RECEIVE_ERROR;
  error: string;
}


export type KnownAction =
  | AddEnvironmentVariableAction
  | ReceiveErrorAction
  | ReceiveEnvironmentVariablesAction
  | RequestEnvironmentVariablesAction
  | UpdateEnvironmentVariableAction
  | RemoveEnvironmentVariableAction;

export type ActionCreators = {
  requestEnvironmentVariables: () => AppThunk<KnownAction, Promise<void>>;
  addEnvironmentVariable: (token: api.EnvironmentVariable) => AppThunk<KnownAction, Promise<void>>;
  updateEnvironmentVariable: (token: api.EnvironmentVariable) => AppThunk<KnownAction, Promise<void>>;
  removeEnvironmentVariable: (token: api.EnvironmentVariable) => AppThunk<KnownAction, Promise<void>>;
};

export const actionCreators: ActionCreators = {
  requestEnvironmentVariables:
    (): AppThunk<KnownAction, Promise<void>> =>
      async (dispatch, getState): Promise<void> => {
        dispatch({
          type: Type.REQUEST_ENVIRONMENT_VARIABLES,
          check: AUTHORIZED,
        });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          dispatch({
            type: Type.RECEIVE_ERROR,
            error,
          });
          throw new Error(error);
        }

        const state = getState();
        const namespace = selectDefaultNamespace(state).name;
        try {
          const environmentVariables = await fetchEnvironmentVariables(namespace);
          dispatch({
            type: Type.RECEIVE_ENVIRONMENT_VARIABLES,
            environmentVariables,
          });
        } catch (e) {
          const errorMessage = helpers.errors.getMessage(e);
          dispatch({
            type: Type.RECEIVE_ERROR,
            error: errorMessage,
          });
          throw e;
        }
      },
  addEnvironmentVariable:
    (token: api.EnvironmentVariable): AppThunk<KnownAction, Promise<void>> =>
      async (dispatch, getState): Promise<void> => {
        dispatch({
          type: Type.REQUEST_ENVIRONMENT_VARIABLES,
          check: AUTHORIZED,
        });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          dispatch({
            type: Type.RECEIVE_ERROR,
            error,
          });
          throw new Error(error);
        }

        const state = getState();
        const namespace = selectDefaultNamespace(state).name;
        let newToken: api.EnvironmentVariable;
        try {
          newToken = await addEnvironmentVariable(namespace, token);
        } catch (e) {
          const errorMessage = helpers.errors.getMessage(e);
          dispatch({
            type: Type.RECEIVE_ERROR,
            error: errorMessage,
          });
          throw e;
        }

        /* request namespace provision as it triggers tokens validation */
        await provisionKubernetesNamespace();

        /* check if the new token is available */

        const allTokens = await fetchEnvironmentVariables(namespace);
        const tokenExists = allTokens.some(t => t.variableName === newToken.variableName);

        if (tokenExists) {
          dispatch({
            type: Type.ADD_ENVIRONMENT_VARIABLE,
            environmentVariable: newToken,
          });
        } else {
          const errorMessage = `Token "${newToken.variableName}" was not added because it is not valid.`;
          dispatch({
            type: Type.RECEIVE_ERROR,
            error: errorMessage,
          });
          throw new Error(errorMessage);
        }
      },

  updateEnvironmentVariable:
    (token: api.EnvironmentVariable): AppThunk<KnownAction, Promise<void>> =>
      async (dispatch, getState): Promise<void> => {
        dispatch({
          type: Type.REQUEST_ENVIRONMENT_VARIABLES,
          check: AUTHORIZED,
        });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          dispatch({
            type: Type.RECEIVE_ERROR,
            error,
          });
          throw new Error(error);
        }

        const state = getState();
        const namespace = selectDefaultNamespace(state).name;
        try {
          const newToken = await updateEnvironmentVariable(namespace, token);
          dispatch({
            type: Type.UPDATE_ENVIRONMENT_VARIABLE,
            environmentVariable: newToken,
          });
        } catch (e) {
          const errorMessage = helpers.errors.getMessage(e);
          dispatch({
            type: Type.RECEIVE_ERROR,
            error: errorMessage,
          });
          throw e;
        }
      },

  removeEnvironmentVariable:
    (environmentVariable: api.EnvironmentVariable): AppThunk<KnownAction, Promise<void>> =>
      async (dispatch, getState): Promise<void> => {
        dispatch({
          type: Type.REQUEST_ENVIRONMENT_VARIABLES,
          check: AUTHORIZED,
        });
        if (!(await selectAsyncIsAuthorized(getState()))) {
          const error = selectSanityCheckError(getState());
          dispatch({
            type: Type.RECEIVE_ERROR,
            error,
          });
          throw new Error(error);
        }

        const state = getState();
        const namespace = selectDefaultNamespace(state).name;
        try {
          await removeEnvironmentVariable(namespace, environmentVariable);
          dispatch({
            type: Type.REMOVE_ENVIRONMENT_VARIABLE,
            environmentVariable,
          });
        } catch (e) {
          const errorMessage = helpers.errors.getMessage(e);
          dispatch({
            type: Type.RECEIVE_ERROR,
            error: errorMessage,
          });
          throw e;
        }
      },
};

const unloadedState: State = {
  isLoading: false,
  environmentVariables: [],
};

export const reducer: Reducer<State> = (
  state: State | undefined,
  incomingAction: Action,
): State => {
  if (state === undefined) {
    return unloadedState;
  }

  const action = incomingAction as KnownAction;
  switch (action.type) {
    case Type.REQUEST_ENVIRONMENT_VARIABLES:
      return createObject<State>(state, {
        isLoading: true,
        error: undefined,
      });
    case Type.RECEIVE_ENVIRONMENT_VARIABLES:
      return createObject<State>(state, {
        isLoading: false,
        environmentVariables: action.environmentVariables,
      });
    case Type.ADD_ENVIRONMENT_VARIABLE:
      return createObject<State>(state, {
        isLoading: false,
        environmentVariables: [...state.environmentVariables, action.environmentVariable],
      });
    case Type.UPDATE_ENVIRONMENT_VARIABLE:
      return createObject<State>(state, {
        isLoading: false,
        environmentVariables: state.environmentVariables.map(token =>
          token.variableName === action.environmentVariable.variableName ? action.environmentVariable : token,
        ),
      });
    case Type.REMOVE_ENVIRONMENT_VARIABLE:
      return createObject<State>(state, {
        isLoading: false,
        environmentVariables: state.environmentVariables.filter(token => token.variableName !== action.environmentVariable.variableName),
      });
    case Type.RECEIVE_ERROR:
      return createObject<State>(state, {
        isLoading: false,
        error: action.error,
      });
    default:
      return state;
  }
}
