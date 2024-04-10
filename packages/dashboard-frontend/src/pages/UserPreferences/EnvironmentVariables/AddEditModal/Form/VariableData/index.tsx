/*
 * Copyright (c) 2018-2024 Red Hat, Inc.
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Contributors:
 *   Red Hat, Inc. - initial API and implementation
 */

import { FormGroup, TextInput, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import React from 'react';

const REQUIRED_ERROR = 'This field is required.';

export type Props = {
  isEdit: boolean;
  variableData: string | undefined;
  onChange: (variableData: string, isValid: boolean) => void;
};

export type State = {
  variableData: string | undefined;
  validated: ValidatedOptions;
};

export class VariableData extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const validated = ValidatedOptions.default;

    this.state = {
      variableData: undefined,
      validated,
    };
  }

  private onChange(variableData: string): void {
    const { onChange } = this.props;
    const validated = this.validate(variableData);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ variableData, validated });
    onChange(btoa(variableData), isValid);
  }

  private validate(variableData: string): ValidatedOptions {
    if (variableData.length === 0) {
      return ValidatedOptions.error;
    } else {
      return ValidatedOptions.success;
    }
  }

  public render(): React.ReactElement {
    const { isEdit } = this.props;
    const { variableData = '' } = this.state;
    const errorMessage = REQUIRED_ERROR;
    const placeholder = isEdit ? 'Replace Variable' : 'Enter a Variable';

    // ignore the validation if it's an edit
    const validated = isEdit ? ValidatedOptions.success : this.state.validated;

    return (
      <FormGroup
        fieldId="variable-data-label"
        helperTextInvalid={errorMessage}
        label="Variable"
        validated={validated}
      >
        <TextInput
          aria-describedby="variable-data-label"
          aria-label="Variable"
          onChange={tokenData => this.onChange(tokenData)}
          placeholder={placeholder}
          type={TextInputTypes.password}
          value={variableData}
        />
      </FormGroup>
    );
  }
}
