#!/bin/bash

set -e
set -u

usage() {
  cat <<EOF
This script add changes made to enable local dashboard development flow against a remote Che Cluster.

EOF
}

parse_args() {
  while [[ "$#" -gt 0 ]]; do
    case $1 in
    '--help')
      usage
      exit 0
      ;;
    *)
      echo "[ERROR] Unknown parameter is used: $1."
      usage
      exit 1
      ;;
    esac
    shift 1
  done
}

parse_args "$@"

CHE_NAMESPACE="${CHE_NAMESPACE:-eclipse-che}"
CHE_SELF_SIGNED_MOUNT_PATH="${CHE_SELF_SIGNED_MOUNT_PATH:-$PWD/run/public-certs}"

DASHBOARD_POD_NAME=$(kubectl get pods -n "$CHE_NAMESPACE" -o=custom-columns=:metadata.name | grep dashboard)

kubectl describe pod "$DASHBOARD_POD_NAME" -n "$CHE_NAMESPACE" > run/.che-dashboard-pod

CHECLUSTER_CR_NAME=$(grep -o 'CHECLUSTER_CR_NAME:.*' run/.che-dashboard-pod | grep -o '\S*$')

kubectl get checluster -n "$CHE_NAMESPACE" "$CHECLUSTER_CR_NAME" -o=json > run/.custom-resources

if [[ -n "$(oc whoami -t)" ]]; then
  echo 'Cluster access token found. Nothing needs to be patched.'
  echo 'Done.'
  exit 0
fi

CHE_HOST=http://localhost:8080
CHE_HOST_ORIGIN=$(kubectl get checluster -n "$CHE_NAMESPACE" eclipse-che -o=json | jq -r '.status.cheURL')

if [[ -z "$CHE_HOST_ORIGIN" ]]; then
  echo '[ERROR] Cannot find cheURL.'
  exit 1
fi

if [ ! -d "$CHE_SELF_SIGNED_MOUNT_PATH" ]; then
  mkdir -p "$CHE_SELF_SIGNED_MOUNT_PATH"
fi

# copy certificate from the dashboard pod
kubectl cp $CHE_NAMESPACE/$DASHBOARD_POD_NAME:/public-certs/che-self-signed/..data/ca.crt "$CHE_SELF_SIGNED_MOUNT_PATH/ca.crt"

GATEWAY=$(kubectl get deployments.apps -n "$CHE_NAMESPACE" che-gateway --ignore-not-found -o=json | jq -e '.spec.template.spec.containers|any(.name == "oauth-proxy")')
if [ "$GATEWAY" == "true" ]; then
  echo 'Detected gateway and oauth-proxy inside. Running in native auth mode.'

  echo 'Cluster access token not found.'
  echo 'Looking for staticClient for local start'
  if kubectl get -n dex configMaps/dex -o jsonpath="{.data['config\.yaml']}" | yq e ".staticClients[0].redirectURIs" - | grep $CHE_HOST/oauth/callback; then
    echo 'Found the staticClient for localStart'
  else
    echo 'Patching dex config map...'
    UPDATED_CONFIG_YAML=$(kubectl get -n dex configMaps/dex -o jsonpath="{.data['config\.yaml']}" | yq e ".staticClients[0].redirectURIs[0] = \"$CHE_HOST/oauth/callback\"" -)
    dq_mid=\\\"
    yaml_esc="${UPDATED_CONFIG_YAML//\"/$dq_mid}"
    kubectl get configMaps/dex -n dex -o json | jq ".data[\"config.yaml\"] |= \"${yaml_esc}\"" | kubectl replace -f -

    # rollout Dex deployment
    echo 'Rolling out Dex deployment...'
    kubectl patch deployment/dex --patch "{\"spec\":{\"replicas\":0}}" -n dex
    echo 'Waiting 5 seconds to dex shut down...'
    sleep 5
    kubectl patch deployment/dex --patch "{\"spec\":{\"replicas\":1}}" -n dex
    echo 'Done.'
  fi

  echo 'Looking for redirect_url for local start'
  if kubectl get configMaps che-gateway-config-oauth-proxy -o jsonpath="{.data}" -n "$CHE_NAMESPACE" | yq e ".[\"oauth-proxy.cfg\"]" - | grep $CHE_HOST/oauth/callback; then
    echo 'Found the redirect_url for localStart'
  else
    if kubectl get deployment/che-operator -n "$CHE_NAMESPACE" -o jsonpath="{.spec.replicas}" | grep 1; then
      echo 'Turn off Che-operator deployment...'
      kubectl patch deployment/che-operator --patch "{\"spec\":{\"replicas\":0}}" -n "$CHE_NAMESPACE"
      echo 'Waiting 10 seconds to operator shut down...'
      sleep 10
      echo 'Done.'
    fi

    echo 'Patching che-gateway-config-oauth-proxy config map...'
    CONFIG_YAML=$(kubectl get configMaps che-gateway-config-oauth-proxy -o jsonpath="{.data}" -n "$CHE_NAMESPACE" | yq e ".[\"oauth-proxy.cfg\"]" - | sed "s/${CHE_HOST_ORIGIN//\//\\/}\/oauth\/callback/${CHE_HOST//\//\\/}\/oauth\/callback/g")
    dq_mid=\\\"
    yaml_esc="${CONFIG_YAML//\"/$dq_mid}"
    kubectl get configMaps che-gateway-config-oauth-proxy -n "$CHE_NAMESPACE" -o json | jq ".data[\"oauth-proxy.cfg\"] |= \"${yaml_esc}\"" | kubectl replace -f -

    # rollout che-server deployment
    echo 'Rolling out che-gateway deployment...'
    kubectl patch deployment/che-gateway --patch "{\"spec\":{\"replicas\":0}}" -n "$CHE_NAMESPACE"
    kubectl patch deployment/che-gateway --patch "{\"spec\":{\"replicas\":1}}" -n "$CHE_NAMESPACE"
    echo 'Done.'
  fi
fi
