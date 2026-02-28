#!/bin/bash
set -euo pipefail

# ─── Mobile Pipeline Setup ────────────────────────────────────────────────────
#
# Creates AWS resources for the mobile CI/CD pipeline:
#   - CodeBuild projects (playwright, android-build, ios-build, devicefarm,
#     gplay-publish, appstore-publish)
#   - CodePipeline with all stages
#
# Prerequisite: backend pipeline setup must be run first (creates shared
# resources: S3 buckets, SNS topic, IAM roles).
#
# Usage:
#   ./cicd/setup-mobile-pipeline.sh
#   ./cicd/setup-mobile-pipeline.sh --dry-run
#
# Prerequisites:
#   - AWS CLI v2
#   - CodeCommit repo 'xaiworkspace-frontend' exists
#   - Shared resources from setup-backend-pipeline.sh exist
#   - Secrets: openclaw-sme/android-signing, openclaw-sme/google-play,
#     openclaw-sme/appstore-connect, openclaw-sme/fastlane-match
# ──────────────────────────────────────────────────────────────────────────────

PROFILE="${AWS_PROFILE:-aws_amplify_docflow4}"
REGION="ap-southeast-2"
ACCOUNT_ID="695829630004"
AWS="aws --profile ${PROFILE}"

PIPELINE_NAME="openclaw-sme-mobile"
CODECOMMIT_REPO="xaiworkspace-frontend"
ARTIFACT_BUCKET="openclaw-sme-pipeline-artifacts-${REGION}"
SNS_TOPIC="openclaw-sme-pipeline-approvals"
CODEBUILD_ROLE="codebuild-openclaw-sme-role"
CODEPIPELINE_ROLE="codepipeline-openclaw-sme-role"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# ── Helpers ──
log()  { echo "  [+] $*"; }
skip() { echo "  [=] $* (exists)"; }
dry()  { echo "  [~] Would create: $*"; }

# ═══════════════════════════════════════════════════════════════════════════════
# CodeBuild Projects
# ═══════════════════════════════════════════════════════════════════════════════

create_codebuild_project() {
  local name="$1"
  local buildspec="$2"
  local description="$3"
  local compute="${4:-BUILD_GENERAL1_SMALL}"
  local image="${5:-aws/codebuild/amazonlinux-aarch64-standard:3.0}"
  local env_type="${6:-ARM_CONTAINER}"
  local env_vars="${7:-}"

  if ${AWS} codebuild batch-get-projects --names "${name}" --region "${REGION}" \
    --query "projects[0].name" --output text 2>/dev/null | grep -q "${name}"; then
    skip "CodeBuild project: ${name}"
    return
  elif ${DRY_RUN}; then
    dry "CodeBuild project: ${name} (${buildspec}, ${env_type})"
    return
  fi

  log "Creating CodeBuild project: ${name}"

  local env_arg="[]"
  if [[ -n "${env_vars}" ]]; then
    env_arg="[${env_vars}]"
  fi

  ${AWS} codebuild create-project \
    --name "${name}" \
    --description "${description}" \
    --source "type=CODECOMMIT,location=https://git-codecommit.${REGION}.amazonaws.com/v1/repos/${CODECOMMIT_REPO},buildspec=${buildspec}" \
    --artifacts "type=CODEPIPELINE" \
    --environment "type=${env_type},computeType=${compute},image=${image},environmentVariables=${env_arg}" \
    --service-role "arn:aws:iam::${ACCOUNT_ID}:role/${CODEBUILD_ROLE}" \
    --region "${REGION}" \
    --output text --query 'project.name'
}

# ═══════════════════════════════════════════════════════════════════════════════
# CodePipeline
# ═══════════════════════════════════════════════════════════════════════════════

create_pipeline() {
  if ${AWS} codepipeline get-pipeline --name "${PIPELINE_NAME}" --region "${REGION}" &>/dev/null; then
    skip "CodePipeline: ${PIPELINE_NAME}"
    return
  elif ${DRY_RUN}; then
    dry "CodePipeline: ${PIPELINE_NAME}"
    return
  fi

  log "Creating CodePipeline: ${PIPELINE_NAME}"

  local SNS_ARN="arn:aws:sns:${REGION}:${ACCOUNT_ID}:${SNS_TOPIC}"
  local ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${CODEPIPELINE_ROLE}"

  ${AWS} codepipeline create-pipeline --region "${REGION}" --pipeline "$(cat <<PIPELINE
{
  "name": "${PIPELINE_NAME}",
  "roleArn": "${ROLE_ARN}",
  "artifactStore": {
    "type": "S3",
    "location": "${ARTIFACT_BUCKET}"
  },
  "stages": [
    {
      "name": "Source",
      "actions": [{
        "name": "CodeCommit",
        "actionTypeId": {
          "category": "Source",
          "owner": "AWS",
          "provider": "CodeCommit",
          "version": "1"
        },
        "configuration": {
          "RepositoryName": "${CODECOMMIT_REPO}",
          "BranchName": "release",
          "PollForSourceChanges": "false"
        },
        "outputArtifacts": [{ "name": "SourceOutput" }]
      }]
    },
    {
      "name": "Test",
      "actions": [{
        "name": "PlaywrightE2E",
        "actionTypeId": {
          "category": "Build",
          "owner": "AWS",
          "provider": "CodeBuild",
          "version": "1"
        },
        "configuration": {
          "ProjectName": "openclaw-sme-frontend-playwright"
        },
        "inputArtifacts": [{ "name": "SourceOutput" }],
        "outputArtifacts": [{ "name": "TestOutput" }]
      }]
    },
    {
      "name": "BuildAndroid",
      "actions": [{
        "name": "AndroidAAB",
        "actionTypeId": {
          "category": "Build",
          "owner": "AWS",
          "provider": "CodeBuild",
          "version": "1"
        },
        "configuration": {
          "ProjectName": "openclaw-sme-android-build"
        },
        "inputArtifacts": [{ "name": "SourceOutput" }],
        "outputArtifacts": [{ "name": "AndroidOutput" }]
      }]
    },
    {
      "name": "BuildiOS",
      "actions": [{
        "name": "iOSTestFlight",
        "actionTypeId": {
          "category": "Build",
          "owner": "AWS",
          "provider": "CodeBuild",
          "version": "1"
        },
        "configuration": {
          "ProjectName": "openclaw-sme-ios-build"
        },
        "inputArtifacts": [{ "name": "SourceOutput" }],
        "outputArtifacts": [{ "name": "iOSOutput" }]
      }]
    },
    {
      "name": "DeviceFarm",
      "actions": [{
        "name": "FuzzAndBrowser",
        "actionTypeId": {
          "category": "Build",
          "owner": "AWS",
          "provider": "CodeBuild",
          "version": "1"
        },
        "configuration": {
          "ProjectName": "openclaw-sme-devicefarm-test"
        },
        "inputArtifacts": [{ "name": "AndroidOutput" }]
      }]
    },
    {
      "name": "Approve",
      "actions": [{
        "name": "ReviewBuilds",
        "actionTypeId": {
          "category": "Approval",
          "owner": "AWS",
          "provider": "Manual",
          "version": "1"
        },
        "configuration": {
          "NotificationArn": "${SNS_ARN}",
          "CustomData": "Review TestFlight build + Device Farm results. Approve store publishing?"
        }
      }]
    },
    {
      "name": "PublishAndroid",
      "actions": [{
        "name": "GooglePlayUpload",
        "actionTypeId": {
          "category": "Build",
          "owner": "AWS",
          "provider": "CodeBuild",
          "version": "1"
        },
        "configuration": {
          "ProjectName": "openclaw-sme-gplay-publish"
        },
        "inputArtifacts": [{ "name": "AndroidOutput" }]
      }]
    },
    {
      "name": "PublishiOS",
      "actions": [{
        "name": "AppStoreSubmit",
        "actionTypeId": {
          "category": "Build",
          "owner": "AWS",
          "provider": "CodeBuild",
          "version": "1"
        },
        "configuration": {
          "ProjectName": "openclaw-sme-appstore-publish"
        },
        "inputArtifacts": [{ "name": "SourceOutput" }]
      }]
    }
  ]
}
PIPELINE
)" --output text --query 'pipeline.name'

  # EventBridge rule: trigger on release/* branch pushes
  log "Creating EventBridge rule for release/* branch trigger..."
  ${AWS} events put-rule \
    --name "openclaw-sme-mobile-trigger" \
    --event-pattern "{
      \"source\": [\"aws.codecommit\"],
      \"detail-type\": [\"CodeCommit Repository State Change\"],
      \"resources\": [\"arn:aws:codecommit:${REGION}:${ACCOUNT_ID}:${CODECOMMIT_REPO}\"],
      \"detail\": {
        \"event\": [\"referenceCreated\", \"referenceUpdated\"],
        \"referenceType\": [\"branch\"],
        \"referenceName\": [{\"prefix\": \"release/\"}]
      }
    }" \
    --region "${REGION}" \
    --output text --query 'RuleArn'

  ${AWS} events put-targets \
    --rule "openclaw-sme-mobile-trigger" \
    --targets "Id=MobilePipeline,Arn=arn:aws:codepipeline:${REGION}:${ACCOUNT_ID}:${PIPELINE_NAME},RoleArn=${ROLE_ARN}" \
    --region "${REGION}" \
    --output text
}

# ═══════════════════════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════════════════════

echo "=== Mobile Pipeline Setup ==="
echo "Profile:  ${PROFILE}"
echo "Region:   ${REGION}"
echo "Pipeline: ${PIPELINE_NAME}"
if ${DRY_RUN}; then echo "Mode:     DRY RUN"; fi
echo ""

echo "── CodeBuild Projects ──"

# Playwright E2E tests (Linux)
create_codebuild_project \
  "openclaw-sme-frontend-playwright" \
  "buildspec-frontend-playwright.yml" \
  "Playwright E2E: chromium, firefox, mobile-chrome" \
  "BUILD_GENERAL1_MEDIUM"

# Android build (Linux)
create_codebuild_project \
  "openclaw-sme-android-build" \
  "buildspec-android-build.yml" \
  "Android: Angular build + Capacitor sync + Gradle AAB/APK" \
  "BUILD_GENERAL1_MEDIUM"

# iOS build (macOS ARM64)
create_codebuild_project \
  "openclaw-sme-ios-build" \
  "buildspec-ios-build.yml" \
  "iOS: Capacitor sync + xcodebuild + Fastlane TestFlight" \
  "BUILD_GENERAL1_LARGE" \
  "aws/codebuild/macos-aarch64-sonoma:4.0" \
  "MAC_ARM"

# Device Farm tests (Linux)
create_codebuild_project \
  "openclaw-sme-devicefarm-test" \
  "buildspec-devicefarm.yml" \
  "Device Farm: Android fuzz + browser smoke tests" \
  "BUILD_GENERAL1_SMALL"

# Google Play publish (Linux)
create_codebuild_project \
  "openclaw-sme-gplay-publish" \
  "buildspec-gplay-publish.yml" \
  "Google Play: upload AAB to internal track" \
  "BUILD_GENERAL1_SMALL"

# App Store publish (macOS ARM64)
create_codebuild_project \
  "openclaw-sme-appstore-publish" \
  "buildspec-ios-publish.yml" \
  "App Store: Fastlane deliver submission" \
  "BUILD_GENERAL1_LARGE" \
  "aws/codebuild/macos-aarch64-sonoma:4.0" \
  "MAC_ARM"

echo ""

echo "── CodePipeline ──"
create_pipeline
echo ""

echo "=== Mobile pipeline setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Store secrets in Secrets Manager:"
echo "     - openclaw-sme/android-signing (KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD)"
echo "     - openclaw-sme/google-play (SERVICE_ACCOUNT_JSON)"
echo "     - openclaw-sme/appstore-connect (APP_STORE_CONNECT_API_KEY_ID, ISSUER_ID, KEY_BASE64)"
echo "     - openclaw-sme/fastlane-match (MATCH_PASSWORD)"
echo "  2. Initialize Fastlane Match: fastlane match init --storage_mode s3"
echo "  3. Create release/* branch to trigger pipeline"
echo "  4. Monitor: ${AWS} codepipeline get-pipeline-state --name ${PIPELINE_NAME} --region ${REGION}"
