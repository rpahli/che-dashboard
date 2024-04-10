import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { baseApiPath } from '@/constants/config';
import { getSchema } from '@/services/helpers';
import { namespacedSchema, environmentVariableBodySchema, environmentVariableParamsSchema } from '@/constants/schemas';
import { getToken } from '@/routes/api/helpers/getToken';
import { getDevWorkspaceClient } from '@/routes/api/helpers/getDevWorkspaceClient';
import { restParams } from '@/models';
import { api } from '@eclipse-che/common';

const tags = ['Environment Variable'];

export function registerEnvironmentVariablesRoutes(instance: FastifyInstance) {
  instance.register(async server => {
    server.get(
      `${baseApiPath}/namespace/:namespace/environment-variables`,
      getSchema({ tags, params: namespacedSchema }),
      async function(request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const token = getToken(request);
        const { environmentVariablesApi } = getDevWorkspaceClient(token);

        return environmentVariablesApi.listInNamespace(namespace);
      },
    );

    server.post(
      `${baseApiPath}/namespace/:namespace/environment-variables`,
      getSchema({ tags, params: namespacedSchema, body: environmentVariableBodySchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const personalAccessToken = request.body as api.EnvironmentVariable;
        const token = getToken(request);
        const { environmentVariablesApi } = getDevWorkspaceClient(token);

        return environmentVariablesApi.create(namespace, personalAccessToken);
      },
    );

    server.patch(
      `${baseApiPath}/namespace/:namespace/environment-variables`,
      getSchema({ tags, params: namespacedSchema, body: environmentVariableBodySchema }),
      async function (request: FastifyRequest) {
        const { namespace } = request.params as restParams.INamespacedParams;
        const personalAccessToken = request.body as api.EnvironmentVariable;
        const token = getToken(request);
        const { environmentVariablesApi } = getDevWorkspaceClient(token);

        return environmentVariablesApi.replace(namespace, personalAccessToken);
      },
    );

    server.delete(
      `${baseApiPath}/namespace/:namespace/environment-variables/:variableName`,
      getSchema({ tags, params: environmentVariableParamsSchema }),
      async function (request: FastifyRequest, reply: FastifyReply) {
        const { namespace, variableName } =
          request.params as restParams.EnvironmentVariableNamespacedParams;

        const token = getToken(request);
        const { environmentVariablesApi } = getDevWorkspaceClient(token);

        await environmentVariablesApi.delete(namespace, variableName);

        reply.code(204).send();
      },
    );
  });
}
