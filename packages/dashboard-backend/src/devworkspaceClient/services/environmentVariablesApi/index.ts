import { IEnvironmentVariablesApi } from '@/devworkspaceClient';
import { CoreV1API, prepareCoreV1API } from '@/devworkspaceClient/services/helpers/prepareCoreV1API';
import k8s from '@kubernetes/client-node';
import { api } from '@eclipse-che/common';
import {
  buildLabelSelector, DUMMY_ENVIRONMENT_VARIABLE_DATA, EnvironmentVariablesSecret, isEnvSecret,
  toEnvironmentVariable, toSecret, toSecretName,
} from '@/devworkspaceClient/services/environmentVariablesApi/helpers';

import { createError } from '@/devworkspaceClient/services/helpers/createError';


const API_ERROR_LABEL = 'CORE_V1_API_ERROR';

export class EnvironmentVariablesService implements IEnvironmentVariablesApi {
  private readonly coreV1API: CoreV1API;
  private readonly config: k8s.KubeConfig;

  constructor(kc: k8s.KubeConfig) {
    this.config = kc;
    this.coreV1API = prepareCoreV1API(kc);
  }

  private async listSecrets(namespace: string): Promise<k8s.V1Secret[]> {
    const labelSelector = buildLabelSelector();
    const resp = await this.coreV1API.listNamespacedSecret(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      labelSelector,
    );
    return resp.body.items;
  }

  async create(namespace: string, environmentVariable: api.EnvironmentVariable): Promise<api.EnvironmentVariable> {
    /* check if secret is already exists */

    try {
      const secrets = await this.listSecrets(namespace);

      const secretName = toSecretName(environmentVariable.variableName);
      const existingSecret = secrets.find(secret => {
        return secret.metadata?.name === secretName;
      });
      if (existingSecret !== undefined) {
        throw new Error(`Token already exists`);
      }
    } catch (error) {
      const additionalMessage = `Unable to add personal access token "${environmentVariable.variableName}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }

    /* create the secret */

    try {
      const secret = toSecret(namespace, environmentVariable);
      const { body } = await this.coreV1API.createNamespacedSecret(namespace, secret);
      return toEnvironmentVariable(body);
    } catch (error) {
      const additionalMessage = `Unable to add personal access token "${environmentVariable.variableName}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }
  }

  delete(namespace: string, name: string): Promise<void> {
    return Promise.resolve(undefined);
  }

  async listInNamespace(namespace: string): Promise<Array<api.EnvironmentVariable>> {
    try {
      const secrets = await this.listSecrets(namespace);
      return secrets
        .filter(secret => isEnvSecret(secret))
        .map(secret => {
          return toEnvironmentVariable(secret);
        });
    } catch (error) {
      const additionalMessage = `Unable to list environment variables in the namespace "${namespace}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }
  }

  async replace(namespace: string, environmentVariable: api.EnvironmentVariable): Promise<api.EnvironmentVariable> {
    const secretName = toSecretName(environmentVariable.variableName);

    /* read the existing secret to get the real token value */

    let existingSecret: k8s.V1Secret;
    try {
      const resp = await this.coreV1API.readNamespacedSecret(secretName, namespace);
      existingSecret = resp.body;
    } catch (error) {
      const additionalMessage = `Unable to find environment variable "${environmentVariable.variableName}" in the namespace "${namespace}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }

    /* replace the dummy token value with the real one */


    if (environmentVariable.variableData === DUMMY_ENVIRONMENT_VARIABLE_DATA && existingSecret.data !== undefined) {
      environmentVariable.variableData = Object.values(existingSecret.data)[0] as string;
    }

    /* replace the existing secret with the new one */

    try {
      const { body } = await this.coreV1API.replaceNamespacedSecret(
        secretName,
        namespace,
        toSecret(namespace, environmentVariable),
      );
      const newSecret = body as EnvironmentVariablesSecret;
      return toEnvironmentVariable(newSecret);
    } catch (error) {
      const additionalMessage = `Unable to replace environment variable "${environmentVariable.variableName}" in the namespace "${namespace}"`;
      throw createError(error, API_ERROR_LABEL, additionalMessage);
    }
  }
}
