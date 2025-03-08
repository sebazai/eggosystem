#!/bin/bash
set -e

# Check if required variables are set
if [ -z "$ENV_ID" ] || [ -z "$CI_JOB_TOKEN" ] || [ -z "$CI_API_V4_URL" ] || [ -z "$CI_PROJECT_ID" ]; then
  echo "Error: Required variables ENV_ID, CI_JOB_TOKEN, CI_API_V4_URL, and CI_PROJECT_ID must be set"
  exit 1
fi

# Clean up registry images - ensure all tags are removed
for IMAGE in eggo-backend eggo-frontend eggo-migrations; do
  echo "Deleting registry image for $IMAGE:${ENV_ID}"
  IMAGE_ID=$(curl --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/registry/repositories" | jq -r ".[] | select(.name==\"kanaliiga_public/kanahub/eggosystem/${IMAGE}\") | .id")
  if [ ! -z "$IMAGE_ID" ]; then
    TAG_ID=$(curl --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/registry/repositories/${IMAGE_ID}/tags" | jq -r ".[] | select(.name==\"${ENV_ID}\") | .id")
    if [ ! -z "$TAG_ID" ]; then
      curl --request DELETE --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/registry/repositories/${IMAGE_ID}/tags/${TAG_ID}"
      echo "Deleted ${IMAGE}:${ENV_ID} from registry"
    else
      echo "Tag ${ENV_ID} not found for ${IMAGE}"
    fi
  else
    echo "Repository ${IMAGE} not found"
  fi
done

# Remove the GitLab environment
echo "Removing GitLab environment..."
if [ ! -z "$CI_PROJECT_ID" ] && [ ! -z "$CI_ENVIRONMENT_ID" ]; then
  curl --request DELETE --header "PRIVATE-TOKEN: ${CI_JOB_TOKEN}" \
    "${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/environments/${CI_ENVIRONMENT_ID}"
  echo "GitLab environment removed"
else
  echo "CI_PROJECT_ID or CI_ENVIRONMENT_ID not set, skipping environment removal"
fi

echo "Environment ${ENV_ID} has been completely removed" 