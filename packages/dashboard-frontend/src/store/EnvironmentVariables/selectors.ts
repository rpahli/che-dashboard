import { AppState } from '@/store';
import { createSelector } from 'reselect';
import { State } from '@/store/EnvironmentVariables';

const selectState = (state: AppState) => state.environmentVariables;

export const selectEnvironmentVariables = createSelector(selectState, (state: State) => state.environmentVariables);

export const selectEnvironmentVariablesIsLoading = createSelector(selectState, state => state.isLoading);
