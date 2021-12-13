#!/usr/bin/env node
const cdk = require("@aws-cdk/core");
const { LodgeAppStage } = require("../lib/lodge-app-stage");
const output = require("../output.json");

const app = new cdk.App({ context: { output } });

new LodgeAppStage(app, "LodgeAppStage", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
