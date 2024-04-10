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
  'The Variable Name must consist of lower case alphanumeric characters, "-" or ".", and must start and end with an alphanumeric character.';
const ALLOWED_CHARACTERS =
  'Alphanumeric characters, "-" or ".", starting and ending with an alphanumeric character.';

const REGEXP = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;

export type Props = {
  isEdit: boolean;
  variableName: string | undefined;
  onChange: (variableName: string, isValid: boolean) => void;
};

export type State = {
  variableName: string | undefined;
  validated: ValidatedOptions;
};

export class VariableName extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);

    const variableName = this.props.variableName;
    const validated = ValidatedOptions.default;

    this.state = { variableName, validated };
  }

  private onChange(variableName: string): void {
    const { onChange } = this.props;
    const validated = this.validate(variableName);
    const isValid = validated === ValidatedOptions.success;

    this.setState({ variableName, validated });
    onChange(variableName, isValid);
  }

  private validate(variableName: string): ValidatedOptions {
    if (variableName.length > MAX_LENGTH) {
      return ValidatedOptions.error;
    } else if (variableName.length === 0) {
      return ValidatedOptions.error;
    } else if (REGEXP.test(variableName) === false) {
      return ValidatedOptions.error;
    } else {
      return ValidatedOptions.success;
    }
  }

  public render(): React.ReactElement {
    const { isEdit } = this.props;
    const { variableName = '', validated } = this.state;
    let errorMessage: string;
    if (variableName.length === 0) {
      errorMessage = REQUIRED_ERROR;
    } else if (variableName.length > MAX_LENGTH) {
      errorMessage = MAX_LENGTH_ERROR;
    } else if (REGEXP.test(variableName) === false) {
      errorMessage = WRONG_CHARACTERS_ERROR;
    } else {
      errorMessage = '';
    }

    const readOnlyAttr = isEdit ? { isReadOnly: true } : {};
    const helperText = isEdit ? {} : { helperText: ALLOWED_CHARACTERS };

    return (
      <FormGroup
        fieldId="variable-name-label"
        helperTextInvalid={errorMessage}
        isRequired
        label="Variable Name"
        validated={validated}
        {...helperText}
      >
        <TextInput
          aria-describedby="variable-name-label"
          aria-label="Variable Name"
          isRequired
          onChange={tokenName => this.onChange(tokenName)}
          placeholder="Enter a Variable Name"
          type={TextInputTypes.text}
          value={variableName}
          {...readOnlyAttr}
        />
      </FormGroup>
    );
  }
}
