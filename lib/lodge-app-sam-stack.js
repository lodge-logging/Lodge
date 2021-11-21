const cdk = require("@aws-cdk/core");
const ec2 = require("@aws-cdk/aws-ec2");
const { Elasticsearch } = require("./constructs/elasticsearch-construct");

class LodgeElasticsearchStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.elasticsearch = new Elasticsearch(this, "elasticsearch", {
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
    });
  }
}

// const { LodgeElasticsearchStack } = require('../lib/lodge-app-sam-stack');
// new LodgeElasticsearchStack(app, 'LodgeElasticsearchStack', {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   }
// });

module.exports = { LodgeElasticsearchStack };
