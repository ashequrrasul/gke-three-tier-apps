export PROJECT_ID="project-40d105bf-bb2b-4bf6-b9f"
export REGION="us-east5"
export REPO="gcp-three-tier"
export FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO/frontend:v2"
docker build -t $FRONTEND_IMAGE .
