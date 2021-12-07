#!/usr/bin/env node
const cdk = require("@aws-cdk/core");
const { LodgeAppStage } = require("../lib/lodge-app-stage");
const output = require("../output.json");

// const AWS = require("aws-sdk");
// const { writeFileSync } = require("fs");

// const keyPath = require("path").join(
//   __dirname,
//   "..",
//   "..",
//   "Lodge",
//   "bin",
//   "lodge-key.pem"
// );

const app = new cdk.App({ context: { output } });
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */
//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: {
//   //   account: process.env.CDK_DEFAULT_ACCOUNT,
//   //   region: process.env.CDK_DEFAULT_REGION,
//   // },
//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },
//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// (async () => {
//   const params = {
//     KeyName: "lodge-key",
//   };
//   try {
//     let res = await new AWS.EC2().createKeyPair(params).promise();
//     writeFileSync(keyPath, res.KeyMaterial);
//   } catch (error) {
//     console.log(error);
//   }
//   new LodgeAppStage(app, "LodgeAppStage", {
//     env: {
//       account: process.env.CDK_DEFAULT_ACCOUNT,
//       region: process.env.CDK_DEFAULT_REGION,
//     },
//   });
// })();

new LodgeAppStage(app, "LodgeAppStage", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
