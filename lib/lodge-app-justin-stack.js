const cdk = require('@aws-cdk/core');
// const sqs = require('@aws-cdk/aws-sqs');
const { Logstash } = require('./constructs/logstash-construct');
const ec2 = require('@aws-cdk/aws-ec2');

class JustinStack extends cdk.Stack {
  /**
   *
   * @param {cdk.Construct} scope
   * @param {string} id
   * @param {cdk.StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'LodgeAppQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
    const logstash = new Logstash(this, 'Logstash', {
      vpc: ec2.Vpc.fromLookup(this, 'test-vpc', {
        isDefault: true
      }),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
  }
}

module.exports = { JustinStack };