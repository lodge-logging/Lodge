const cdk = require("@aws-cdk/core");
const ec2 = require('@aws-cdk/aws-ec2');
//const { VPC } = require('./constructs/vpc-construct');

class ReginaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // const selectedVpc = this.node.tryGetContext('VPC_ID');
    // const ips = this.node.tryGetContext('IP_ADDRESSES');

    // const user = this.node.tryGetContext('USER_CIDR');
    // const app = this.node.tryGetContext('APP_CIDR');

    // this.importedVPC = ec2.Vpc.fromLookup(this, 'Imported-VPC', {
    //   // This imports the default VPC but you can also
    //   // specify a 'vpcName' or 'tags'.
    //   vpcId: selectedVpc.id,
    //   isDefault: true,
    // });

    console.log(user, app);
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
