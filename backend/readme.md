export PROJECT_ID="project-40d105bf-bb2b-4bf6-b9f"
export REGION="us-east5"
export REPO="gcp-three-tier"
docker build   -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/backend:v2 .
docker push   $REGION-docker.pkg.dev/$PROJECT_ID/$REPO/backend:v2



