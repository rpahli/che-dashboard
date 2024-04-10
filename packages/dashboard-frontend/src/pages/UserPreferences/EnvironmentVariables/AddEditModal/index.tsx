import React from 'react';
import { api } from '@eclipse-che/common';
import { EditEnvironmentVariableProps } from '@/pages/UserPreferences/EnvironmentVariables/types';
import { Button, ButtonVariant, Modal, ModalVariant } from '@patternfly/react-core';
import { AddEditModalForm } from '@/pages/UserPreferences/EnvironmentVariables/AddEditModal/Form';
import { EditTokenProps } from '@/pages/UserPreferences/PersonalAccessTokens/types';

export type Props = EditEnvironmentVariableProps & {
  cheUserId: string;
  isOpen: boolean;
  onSaveToken: (variable: api.EnvironmentVariable) => void;
  onCloseModal: () => void;
};

export type State = {
  environmentVariable: api.EnvironmentVariable | undefined;
  isSaveEnabled: boolean;
};

export class EnvironmentVariableAddEditModal extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      environmentVariable: props.variable,
      // initially disabled until something changes and form is valid
      isSaveEnabled: false,
    };
  }

  private handleSaveToken(): void {
    const { environmentVariable } = this.state;
    if (environmentVariable) {
      this.props.onSaveToken(environmentVariable);
    }
  }

  private handleCloseModal(): void {
    this.props.onCloseModal();
  }

  private handleChangeToken(environmentVariable: api.EnvironmentVariable, isValid: boolean): void {
    this.setState({
      environmentVariable,
      isSaveEnabled: isValid,
    });
  }

  private buildModalFooter(): React.ReactNode {
    const { isEdit } = this.props;
    const isDisabled = this.state.isSaveEnabled === false;

    return (
      <React.Fragment>
        <Button
          variant={ButtonVariant.primary}
          isDisabled={isDisabled}
          onClick={() => this.handleSaveToken()}
        >
          {isEdit ? 'Save' : 'Add'}
        </Button>
        <Button variant={ButtonVariant.link} onClick={() => this.handleCloseModal()}>
          Cancel
        </Button>
      </React.Fragment>
    );
  }

  public render(): React.ReactElement {
    const { cheUserId, isEdit, isOpen } = this.props;

    const modalTitle = isEdit ? 'Edit Environment Variable' : 'Add Environment Variable';
    const modalFooter = this.buildModalFooter();

    const editTokenProps: EditEnvironmentVariableProps =
      isEdit === true
        ? {
          isEdit: this.props.isEdit,
          variable: this.props.variable,
        }
        : {
          isEdit: this.props.isEdit,
          variable: this.props.variable,
        };

    return (
      <Modal
        aria-label={modalTitle}
        title={modalTitle}
        variant={ModalVariant.small}
        isOpen={isOpen}
        onClose={() => this.handleCloseModal()}
        footer={modalFooter}
      >
        <AddEditModalForm
          cheUserId={cheUserId}
          onChange={(...args) => this.handleChangeToken(...args)}
          {...editTokenProps}
        />
      </Modal>
    );
  }
}
