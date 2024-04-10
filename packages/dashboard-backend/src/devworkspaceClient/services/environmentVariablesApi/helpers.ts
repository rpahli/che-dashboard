import * as k8s from '@kubernetes/client-node';
import { api } from '@eclipse-che/common';

export const DUMMY_ENVIRONMENT_VARIABLE_DATA = 'ZHVtbXktYWNjZXNzLXRva2VuLUhxS3JaVkNadlNwN3FQTEY=';

export const SECRET_LABELS = {
  'app.kubernetes.io/component': 'che-environment-variable',
  'app.kubernetes.io/part-of': 'che.eclipse.org',
} as EnvironmentVariablesSecret['metadata']['labels'];

export type EnvironmentVariableName = `che-environment-variable-${string}`;
export type CheUserId = string;

export interface EnvironmentVariablesSecret extends k8s.V1Secret {
  metadata: k8s.V1ObjectMeta & {
    name: EnvironmentVariableName;
    labels: {
      'app.kubernetes.io/component': 'che-environment-variable';
      'app.kubernetes.io/part-of': 'che.eclipse.org';
      'controller.devfile.io/mount-to-devworkspace': 'true';
      'controller.devfile.io/watch-secret': 'true';
    };
    annotations: {
      'controller.devfile.io/mount-as': 'env';
      'che.eclipse.org/che-userid': CheUserId;
    }
  };
  data: {};
}

export function buildLabelSelector(): string {
  return Object.entries(SECRET_LABELS)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

export function isEnvSecret(secret: k8s.V1Secret): secret is EnvironmentVariablesSecret {
  const hasLabels =
    secret.metadata?.labels !== undefined &&
    secret.metadata.labels['app.kubernetes.io/component'] === 'che-environment-variable' &&
    secret.metadata.labels['app.kubernetes.io/part-of'] === 'che.eclipse.org';

  return hasLabels;
}

export function toSecretName(tokenName: string): EnvironmentVariableName {
  return `che-environment-variable-${tokenName}`;
}

export function toEnvironmentVariable(secret: k8s.V1Secret): api.EnvironmentVariable {
  if (!isEnvSecret(secret)) {
    throw new Error('Secret is not an environment variable');
  }

  return {
    variableName: secret.metadata.name.replace('che-environment-variable-', ''),
    cheUserId: secret.metadata.annotations['che.eclipse.org/che-userid'],
    variableKey: Object.keys(secret.data)[0],
    variableData: DUMMY_ENVIRONMENT_VARIABLE_DATA,
  };
}

export function toSecret(
  namespace: string,
  token: api.EnvironmentVariable,
): EnvironmentVariablesSecret {
  if (token.variableData === DUMMY_ENVIRONMENT_VARIABLE_DATA) {
    throw new Error('environment variable is not defined');
  }

  let annotations: EnvironmentVariablesSecret['metadata']['annotations'];
  let labels: EnvironmentVariablesSecret['metadata']['labels'];


  annotations = {
    'controller.devfile.io/mount-as': 'env',
    'che.eclipse.org/che-userid': token.cheUserId,
  };
  labels = {
    'app.kubernetes.io/component': 'che-environment-variable',
    'app.kubernetes.io/part-of': 'che.eclipse.org',
    'controller.devfile.io/mount-to-devworkspace': 'true',
    'controller.devfile.io/watch-secret': 'true',
  };

  const data: Record<any, any> = {};
  data[token.variableKey] = token.variableData;

  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: toSecretName(token.variableName),
      namespace,
      labels,
      annotations,
    },
    data: data,
  };
}
