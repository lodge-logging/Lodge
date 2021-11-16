const cdk = require("@aws-cdk/core");
const { Elasticsearch } = require('./constructs/elasticsearch-construct');
const { VPC } = require('./constructs/vpc-construct');

class SamStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);
    const { vpc, securityGroups } = new VPC(this, 'VPC');
    
    const elasticsearch = new Elasticsearch(this, 'elasticsearch', {
      vpc,
      securityGroup: securityGroups.elasticsearchSG
    })
  }
}

module.exports = { SamStack };
