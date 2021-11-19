const cdk = require("@aws-cdk/core");
const ec2 = require('@aws-cdk/aws-ec2');
const { VPC } = require('./constructs/vpc-construct');

class ReginaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new VPC(this, 'VPC');

  }
}

// const { ReginaStack } = require('../lib/lodge-app-regina-stack');
// new ReginaStack(app, 'ReginaStack', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   }
// });

module.exports = { ReginaStack };
