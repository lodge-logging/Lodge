const cdk = require("@aws-cdk/core");
const { s3Bucket } = require("../constructs/s3-construct");

class LodgeS3Stack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    this.bucket = new s3Bucket(this, "s3Bucket", {
      vpc: props.vpc,
    });
  }
}

module.exports = { LodgeS3Stack };
