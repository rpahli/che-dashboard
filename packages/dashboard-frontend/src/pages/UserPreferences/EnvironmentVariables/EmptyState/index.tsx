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

import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Title,
} from '@patternfly/react-core';
import { KeyIcon, PlusCircleIcon } from '@patternfly/react-icons';
import React from 'react';

export type Props = {
  isDisabled: boolean;
  onAddVariable: () => void;
};

export class EnvironmentVariableEmptyState extends React.PureComponent<Props> {
  public render(): React.ReactElement {
    return (
      <EmptyState isFullHeight={true} variant={EmptyStateVariant.small}>
        <EmptyStateIcon icon={KeyIcon} />
        <Title headingLevel="h4" size="lg">
          No Environment Variables
        </Title>
        <EmptyStateBody>
          <Button
            icon={<PlusCircleIcon />}
            aria-label="Add Environment Variable"
            variant="link"
            isDisabled={this.props.isDisabled}
            onClick={() => this.props.onAddVariable()}
          >
            Add Personal Access Token
          </Button>
        </EmptyStateBody>
      </EmptyState>
    );
  }
}
