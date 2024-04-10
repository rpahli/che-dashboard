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

const MAX_LENGTH = 255;
const MAX_LENGTH_ERROR = `The Variable Name is too long. The maximum length is ${MAX_LENGTH} characters.`;
const REQUIRED_ERROR = 'This field is required.';
const WRONG_CHARACTERS_ERROR =
  'The Variable Name must consist of alphanumeric characters or "_", and must start and end with an alphanumeric character.';
const ALLOWED_CHARACTERS =
  'Alphanumeric characters or "_", starting and ending with an alphanumeric character.';

const REGEXP = /^[a-zA-Z0-9]([_a-zA-Z0-9]*[a-zA-Z0-9])?([a-zA-Z0-9]([_a-zA-Z0-9]*[a-zA-Z0-9])?)*$/;

export type Props = {
  isEdit: boolean;
  variableKey: string | undefined;
  onChange: (variableName: string, isValid: boolean) => void;
};

export type State = {
  variableKey: string | undefined;
  validated: ValidatedOptions;
};

export class VariableKey extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const variableKey = this.props.variableKey;
    const validated = ValidatedOptions.default;

    this.state = { variableKey, validated };
  }

  private onChange(variableKey: string): void {
    const { onChange } = this.props;
    const validated = this.validate(variableKey);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ variableKey, validated });
    onChange(variableKey, isValid);
  }

  private validate(variableKey: string): ValidatedOptions {
    if (variableKey.length > MAX_LENGTH) {
      return ValidatedOptions.error;
    } else if (variableKey.length === 0) {
      return ValidatedOptions.error;
    } else if (REGEXP.test(variableKey) === false) {
      return ValidatedOptions.error;
    } else {
      return ValidatedOptions.success;
    }
  }

  public render(): React.ReactElement {
    const { isEdit } = this.props;
    const { variableKey = '', validated } = this.state;
    let errorMessage: string;
    if (variableKey.length === 0) {
      errorMessage = REQUIRED_ERROR;
    } else if (variableKey.length > MAX_LENGTH) {
      errorMessage = MAX_LENGTH_ERROR;
    } else if (REGEXP.test(variableKey) === false) {
      errorMessage = WRONG_CHARACTERS_ERROR;
    } else {
      errorMessage = '';
    }

    const readOnlyAttr = isEdit ? { isReadOnly: true } : {};
    const helperText = isEdit ? {} : { helperText: ALLOWED_CHARACTERS };

    return (
      <FormGroup
        fieldId="variable-key-label"
        helperTextInvalid={errorMessage}
        isRequired
        label="Variable Key"
        validated={validated}
        {...helperText}
      >
        <TextInput
          aria-describedby="variable-key-label"
          aria-label="Variable Key"
          isRequired
          onChange={tokenName => this.onChange(tokenName)}
          placeholder="Enter a Variable Key"
          type={TextInputTypes.text}
          value={variableKey}
          {...readOnlyAttr}
        />
      </FormGroup>
    );
  }
}
