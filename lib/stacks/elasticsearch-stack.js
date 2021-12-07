const cdk = require("@aws-cdk/core");
const { Elasticsearch } = require("../constructs/elasticsearch-construct");

class LodgeElasticsearchStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.elasticsearch = new Elasticsearch(this, "elasticsearch", {
      env: props.env,
      vpc: props.vpc,
      sshKey: props.sshKey,
      securityGroup: props.securityGroup,
      esRole: props.esRole,
      PrivateSubnets: props.PrivateSubnets,
    });
  }
}

module.exports = { LodgeElasticsearchStack };
