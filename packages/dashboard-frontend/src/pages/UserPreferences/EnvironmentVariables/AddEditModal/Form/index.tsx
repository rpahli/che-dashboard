import React from 'react';
import { api } from '@eclipse-che/common';
import { Form } from '@patternfly/react-core';
import { EditEnvironmentVariableProps } from '@/pages/UserPreferences/EnvironmentVariables/types';
import { VariableName } from '@/pages/UserPreferences/EnvironmentVariables/AddEditModal/Form/VariableName';
import { VariableData } from '@/pages/UserPreferences/EnvironmentVariables/AddEditModal/Form/VariableData';
import { VariableKey } from '@/pages/UserPreferences/EnvironmentVariables/AddEditModal/Form/VariableKey';

export type Props = EditEnvironmentVariableProps & {
  cheUserId: string;
  onChange: (token: api.EnvironmentVariable, isValid: boolean) => void;
};

export type State = {
  variableName: string | undefined;
  variableNameIsValid: boolean;
  variableKey: string | undefined;
  variableKeyIsValid: boolean;
  variableData: string | undefined;
  variableDataIsValid: boolean;
};

export class AddEditModalForm extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const { variableName, variableKey, variableData } = props.variable || {};

    const isValid = this.props.isEdit;

    this.state = {
      variableName,
      variableNameIsValid: isValid,
      variableKey,
      variableKeyIsValid: isValid,
      variableData,
      variableDataIsValid: isValid,
    };
  }

  private updateChangeToken(partialState: Partial<State>): void {
    const { cheUserId } = this.props;
    const nextState = { ...this.state, ...partialState };
    this.setState(nextState);

    const {
      variableName = '',
      variableNameIsValid,
      variableKey = '',
      variableKeyIsValid,
      variableData = '',
      variableDataIsValid,
    } = nextState;

    const variable: api.EnvironmentVariable = {
      cheUserId,
      variableName,
      variableKey,
      variableData,
    };

    const isValid = variableNameIsValid && variableKeyIsValid && variableDataIsValid;
    this.props.onChange(variable, isValid);
  }

  private handleChangeVariableName(variableName: string, variableNameIsValid: boolean): void {
    this.updateChangeToken({
      variableName,
      variableNameIsValid,
    });
  }

  private handleChangeVariableKey(variableKey: string, variableKeyIsValid: boolean): void {
    this.updateChangeToken({
      variableKey,
      variableKeyIsValid,
    });
  }

  private handleChangeVariableData(variableData: string, variableDataIsValid: boolean): void {
    this.updateChangeToken({
      variableData,
      variableDataIsValid,
    });
  }

  public render(): React.ReactElement {
    const { isEdit } = this.props;
    const {
      variableName,
      variableKey,
      variableData,
    } = this.state;
    return (
      <Form onSubmit={e => e.preventDefault()}>
        <VariableName
          isEdit={isEdit}
          variableName={variableName}
          onChange={(...args) => this.handleChangeVariableName(...args)}
        />
        <VariableKey
          isEdit={isEdit}
          variableKey={variableKey}
          onChange={(...args) => this.handleChangeVariableKey(...args)}
        />
        <VariableData
          isEdit={isEdit}
          variableData={variableData}
          onChange={(...args) => this.handleChangeVariableData(...args)}
        />
      </Form>
    );
  }
}
