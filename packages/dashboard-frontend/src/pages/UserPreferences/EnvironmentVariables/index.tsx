import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import * as UserIdStore from '@/store/User/Id';
import { AppState } from '@/store';
import {
  selectEnvironmentVariables,
  selectEnvironmentVariablesIsLoading,
} from '@/store/EnvironmentVariables/selectors';
import { selectCheUserId, selectCheUserIdError, selectCheUserIsLoading } from '@/store/User/Id/selectors';
import ProgressIndicator from '@/components/Progress';
import { EnvironmentVariableList } from '@/pages/UserPreferences/EnvironmentVariables/List';
import { api } from '@eclipse-che/common';
import { EnvironmentVariableEmptyState } from '@/pages/UserPreferences/EnvironmentVariables/EmptyState';
import { EnvironmentVariableAddEditModal } from '@/pages/UserPreferences/EnvironmentVariables/AddEditModal';
import { AlertVariant, pluralize } from '@patternfly/react-core';
import { EditEnvironmentVariableProps } from '@/pages/UserPreferences/EnvironmentVariables/types';
import * as EnvironmentVariablesStore from '@/store/EnvironmentVariables';
import { lazyInject } from '@/inversify.config';
import { AppAlerts } from '@/services/alerts/appAlerts';
import { PersonalAccessTokenDeleteModal } from '@/pages/UserPreferences/PersonalAccessTokens/DeleteModal';
import { EnvironmentVariableDeleteModal } from '@/pages/UserPreferences/EnvironmentVariables/DeleteModal';

type Props = MappedProps;

type State = {
  isAddEditOpen: boolean;
  editVariable: api.EnvironmentVariable | undefined;
  isDeleteOpen: boolean;
  deleteVariables: api.EnvironmentVariable[];
  isDeleting: boolean;
};

export class EnvironmentVariables extends React.PureComponent<Props, State> {
  @lazyInject(AppAlerts)
  private readonly appAlerts: AppAlerts;

  constructor(props: Props) {
    super(props);
    this.state = {
      isAddEditOpen: false,
      editVariable: undefined,
      isDeleteOpen: false,
      deleteVariables: [],
      isDeleting: false,
    };
  }
  public async componentDidMount(): Promise<void> {
    const { cheUserIdIsLoading, environmentVariablesIsLoading, requestCheUserId, requestEnvironmentVariables } =
      this.props;
    const promises: Array<Promise<unknown>> = [];
    if (!cheUserIdIsLoading) {
      promises.push(requestCheUserId());
    }
    if (!environmentVariablesIsLoading) {
      promises.push(requestEnvironmentVariables());
    }
    const results = await Promise.allSettled(promises);
    // log failed promises into console
    results
      .filter(result => result.status === 'rejected')
      .forEach(result => console.error((result as PromiseRejectedResult).reason));
  }

  private handleShowAddEditModal(editVariable?: api.EnvironmentVariable): void {
    this.setState({
      editVariable,
      isAddEditOpen: true,
    });
  }

  private handleCloseAddEditModal(): void {
    this.setState({
      isAddEditOpen: false,
    });
  }

  private handleShowDeleteModal(deleteVariables: api.EnvironmentVariable[]): void {
    this.setState({
      isDeleteOpen: true,
      deleteVariables,
    });
  }

  private handleCloseDeleteModal(): void {
    this.setState({
      isDeleteOpen: false,
    });
  }

  private async handleDeleteTokens(deleteVariables: api.EnvironmentVariable[]): Promise<void> {
    this.setState({
      isDeleteOpen: false,
      isDeleting: true,
    });

    const promises = deleteVariables.map(async token => {
      try {
        return await this.props.removeEnvironmentVariable(token);
      } catch (error) {
        console.error('Failed to delete variable. ', error);
        throw error;
      }
    });
    const results = await Promise.allSettled(promises);

    this.setState({
      isDeleting: false,
    });

    const failedNumber = results.filter(result => result.status === 'rejected').length;
    const failedVariables = pluralize(failedNumber, 'variable');

    const successNumber = results.filter(result => result.status === 'fulfilled').length;
    const successVariables = pluralize(successNumber, 'variable');

    const allVariables = pluralize(deleteVariables.length, 'variable');

    if (successNumber === deleteVariables.length) {
      this.appAlerts.showAlert({
        key: 'delete-variables-success',
        title: `${successVariables} deleted successfully`,
        variant: AlertVariant.success,
      });
    } else {
      this.appAlerts.showAlert({
        key: 'delete-variable-success',
        title: `${successNumber} of ${allVariables} deleted successfully`,
        variant: AlertVariant.success,
      });
      this.appAlerts.showAlert({
        key: 'delete-variable-error',
        title: `Failed to delete ${failedVariables}`,
        variant: AlertVariant.danger,
      });
    }
  }

  private async handleSaveVariable(environmentVariable: api.EnvironmentVariable): Promise<void> {
    const { editVariable } = this.state;

    this.setState({
      isAddEditOpen: false,
      editVariable: undefined,
    });

    try {
      if (editVariable) {
        await this.props.updateEnvironmentVariable(environmentVariable);
      } else {
        await this.props.addEnvironmentVariable(environmentVariable);
      }

      this.appAlerts.showAlert({
        key: 'save-token-success',
        title: 'Token saved successfully.',
        variant: AlertVariant.success,
      });
    } catch (error) {
      console.error('Failed to save token. ', error);
    }
  }

  render(): React.ReactNode {
    const {
      cheUserId,
      cheUserIdError,
      cheUserIdIsLoading,
      environmentVariables,
      environmentVariablesIsLoading,
    } = this.props;
    const { isAddEditOpen, editVariable, isDeleteOpen, deleteVariables,isDeleting } = this.state;
    const isEdit = editVariable !== undefined;
    const isLoading = cheUserIdIsLoading || environmentVariablesIsLoading;
    const isDisabled = isLoading || isDeleting || cheUserIdError !== undefined;

    const editVariableProps: EditEnvironmentVariableProps = isEdit
      ? {
        isEdit,
        variable: editVariable,
      }
      : {
        isEdit,
        variable: editVariable,
      };

    return (
      <React.Fragment>
        <ProgressIndicator isLoading={isLoading} />
        <EnvironmentVariableAddEditModal
          cheUserId={cheUserId}
          isOpen={isAddEditOpen}
          onCloseModal={() => this.handleCloseAddEditModal()}
          onSaveToken={(...args) => this.handleSaveVariable(...args)}
          {...editVariableProps}
        />
        <EnvironmentVariableDeleteModal
          isOpen={isDeleteOpen}
          deleteItems={deleteVariables}
          onCloseModal={() => this.handleCloseDeleteModal()}
          onDelete={(...args) => this.handleDeleteTokens(...args)}
        />
        {environmentVariables.length === 0 ? (
          <EnvironmentVariableEmptyState
            isDisabled={isDisabled}
            onAddVariable={(...args) => this.handleShowAddEditModal(...args)}
          />
        ) : (
          <EnvironmentVariableList
            isDisabled={isDisabled}
            variables={environmentVariables}
            onAddVariable={(...args) => this.handleShowAddEditModal(...args)}
            onEditVariable={(...args) => this.handleShowAddEditModal(...args)}
            onDeleteVariables={(...args) => this.handleShowDeleteModal(...args)}
          />
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  cheUserId: selectCheUserId(state),
  cheUserIdError: selectCheUserIdError(state),
  cheUserIdIsLoading: selectCheUserIsLoading(state),
  environmentVariables: selectEnvironmentVariables(state),
  environmentVariablesIsLoading: selectEnvironmentVariablesIsLoading(state),
});

const connector = connect(
  mapStateToProps,
  { ...EnvironmentVariablesStore.actionCreators, ...UserIdStore.actionCreators },
  null,
  {
    // forwardRef is mandatory for using `@react-mock/state` in unit tests
    forwardRef: true,
  },
);

type MappedProps = ConnectedProps<typeof connector>;
export default connector(EnvironmentVariables);
