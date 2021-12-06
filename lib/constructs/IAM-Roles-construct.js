const iam = require("@aws-cdk/aws-iam");
const cdk = require("@aws-cdk/core");
class IAMRole extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    // s3 policy
    const s3AccessPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: [`${props.bucket.bucketArn}/*`],
          actions: ["s3:*"],
          // 👇 Default for `effect` is ALLOW
          effect: iam.Effect.ALLOW,
        }),
      ],
    });
    // s3 role attacted to s3 policy
    this.s3Role = new iam.Role(this, "ec2-s3-access", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "An example IAM role in AWS CDK",
      inlinePolicies: {
        // 👇 attach the Policy Document as inline policies
        s3AccessPolicy,
      },
    });
    // es cluster discovery policy
    const clusterDiscovery = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          resources: ["*"],
          actions: ["ec2:DescribeInstances"],
          // 👇 Default for `effect` is ALLOW
          effect: iam.Effect.ALLOW,
        }),
      ],
    });

    // 👇 Create role, to which we'll attach our Policies
    this.esRole = new iam.Role(this, "ec2-describe-instances", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "es cluster discovery role",
      inlinePolicies: {
        // 👇 attach the Policy Document as inline policies
        clusterDiscovery,
      },
    });

    //ec2 Role
    this.ec2Role = new iam.Role(this, "ec2-role", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("ec2.amazonaws.com"),
        new iam.ServicePrincipal("ssm.amazonaws.com")
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          this,
          "ssmManaged",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ),
      ],
    });
  }
}

module.exports = { IAMRole };
