const cdk = require("@aws-cdk/core");
const s3 = require("@aws-cdk/aws-s3");
const iam = require("@aws-cdk/aws-iam");

class s3Bucket extends cdk.Construct {
  constructor(scope, id, props) {
    super(scope, id, props);

    // create the s3 bucket
    this.instance = new s3.Bucket(this, "s3-bucket", {
      // removalpolicy: cdk.RemovalPolicy.DESTROY, // destroy bucket when stack deleted
      // autoDeleteObjects: true, // empty bucket content when stack deleted
      versioned: false,
      publicReadAccess: false, // no public access for READ
      encryption: s3.BucketEncryption.S3_MANAGED, // server side encryption
      lifecycleRules: [
        {
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(90),
          // how long are files stored in s3 before deleted
          expiration: cdk.Duration.days(365),
          //  an array of transition rules that specify after how many days the object should be transitioned to a different storage tier
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(60),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(180),
            },
          ],
        },
      ],
    });

    // create the bucket policy
    const bucketPolicy = new s3.BucketPolicy(this, "s3-bucket-policy", {
      bucket: this.instance,
    });

    bucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.AnyPrincipal()],
        actions: ["s3:*"],
        resources: [`${this.instance.bucketArn}/*`],
      })
    );
  }
}

module.exports = { s3Bucket };
