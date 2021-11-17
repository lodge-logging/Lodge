const cdk = require("@aws-cdk/core");
const ec2 = require('@aws-cdk/aws-ec2');
const { Elasticsearch } = require('./constructs/elasticsearch-construct');
const { VPC } = require('./constructs/vpc-construct');

class SamStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const createSSHKey = () => 'test-key';
    const sshKey = createSSHKey();

    const { vpc, securityGroups } = new VPC(this, 'VPC');

    const sharedProps = { vpc, sshKey };

    // const sshHost = new ec2.BastionHostLinux(this, 'ssh-host', {
    //   vpc,
    //   instanceName: 'ssh-host',
    //   securityGroup: securityGroups.sshSG,
    // });

    const elasticsearch = new Elasticsearch(this, 'elasticsearch', Object.assign(sharedProps, {
      securityGroup: securityGroups.elasticsearchSG
    }));
  }
}

// const { SamStack } = require('../lib/lodge-app-sam-stack');
// new SamStack(app, 'SamStack', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   }
// });

module.exports = { SamStack };
