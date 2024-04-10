import React from 'react';
import { api } from '@eclipse-che/common';
import { PageSection } from '@patternfly/react-core';
import {
  ActionsColumn,
  IAction,
  TableComposable,
  TableVariant,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { EnvironmentVariableListToolbar } from '@/pages/UserPreferences/EnvironmentVariables/Toolbar';

const COLUMN_NAMES: Omit<
  Record<keyof api.EnvironmentVariable, string>,
  'cheUserId' | 'variableData'
> = {
  variableName: 'Name',
  variableKey: 'Key',
};

export type Props = {
  isDisabled: boolean;
  variables: api.EnvironmentVariable[];
  onAddVariable: () => void;
  onEditVariable: (token: api.EnvironmentVariable) => void;
  onDeleteVariables: (tokens: api.EnvironmentVariable[]) => void;
};
export type State = {
  selectedVariables: api.EnvironmentVariable[];
};

export class EnvironmentVariableList extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      selectedVariables: [],
    };
  }

  private handleSelectAllTokens(
    _event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...rest: unknown[]
  ): void {
    this.setState({
      selectedVariables: isSelected ? this.props.variables : [],
    });
  }

  private handleSelectToken(
    _event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ...rest: unknown[]
  ): void {
    const selectedToken = this.props.variables[rowIndex];
    const selectedVariables = isSelected
      ? [...this.state.selectedVariables, selectedToken]
      : this.state.selectedVariables.filter(token => token.variableName !== selectedToken.variableName);

    this.setState({
      selectedVariables,
    });
  }

  private handleAddVariable(): void {
    this.props.onAddVariable();
  }

  private handleEditVariable(token: api.EnvironmentVariable): void {
    this.props.onEditVariable(token);
  }

  private handleDeleteSelectedVariables(): void {
    this.props.onDeleteVariables(this.state.selectedVariables);
  }

  private handleDeleteVariable(token: api.EnvironmentVariable): void {
    this.props.onDeleteVariables([token]);
  }

  private buildHeadRow(): React.ReactElement {
    const { isDisabled, variables } = this.props;
    const { selectedVariables } = this.state;

    const areAllTokensSelected = selectedVariables.length === variables.length;

    return (
      <Tr>
        <Th
          select={{
            onSelect: (...args) => this.handleSelectAllTokens(...args),
            isSelected: areAllTokensSelected,
            isDisabled: isDisabled,
            isHeaderSelectDisabled: isDisabled,
          }}
        />
        <Th>{COLUMN_NAMES.variableName}</Th>
        <Th>{COLUMN_NAMES.variableKey}</Th>
        <Td />
      </Tr>
    );
  }

  private buildRowAction(token: api.EnvironmentVariable): IAction[] {
    return [
      {
        title: 'Edit Variable',
        onClick: () => this.handleEditVariable(token),
      },
      {
        title: 'Delete Variable',
        onClick: () => this.handleDeleteVariable(token),
      },
    ];
  }


  private buildBodyRows(): React.ReactElement[] {
    const { isDisabled, variables } = this.props;
    const { selectedVariables } = this.state;

    return variables.map((token, rowIndex) => {
      const rowActions = this.buildRowAction(token);
      return (
        <Tr key={token.variableName}>
          <Td
            select={{
              rowIndex,
              onSelect: (...args) => this.handleSelectToken(...args),
              isSelected: selectedVariables.includes(token),
              disable: isDisabled,
            }}
          />
          <Td dataLabel={COLUMN_NAMES.variableName}>{token.variableName}</Td>
          <Td dataLabel={COLUMN_NAMES.variableKey}>{token.variableKey}</Td>
          <Td isActionCell>
            <ActionsColumn isDisabled={isDisabled} items={rowActions} />
          </Td>
        </Tr>
      );
    });
  }

  public render(): React.ReactElement {
    const { isDisabled } = this.props;
    const { selectedVariables } = this.state;
    const headRow = this.buildHeadRow();
    const bodyRows = this.buildBodyRows();

    return (
      <PageSection>
        <EnvironmentVariableListToolbar
          isDisabled={isDisabled}
          selectedItems={selectedVariables}
          onAdd={() => this.handleAddVariable()}
          onDelete={() => this.handleDeleteSelectedVariables()}
        />
        <TableComposable aria-label="Environment Variables List" variant={TableVariant.compact}>
          <Thead>{headRow}</Thead>
          <Tbody>{bodyRows}</Tbody>
        </TableComposable>
      </PageSection>
    );
  }
}
