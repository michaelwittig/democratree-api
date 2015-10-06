# democratree API

This is part of the democratree app caring about the HTTP(S) API. The API is provided by AWS API Gateway. It provides a GiotHub Hook compatible resource to process commit hooks from GitHub. It communicates with the ruby workers with SQS.

## Building & deploying the Lambda

1. Inside `lambda` run the `bundle.sh` script which creates a file called `lambda.zip`.
2. upload the `lambda.zip`file to S3 bucket called `democratree-api-lambdabucket-*`
3. grap the new version of the S3 object and update the CloudFormation stack `democratree-api` parameter `LambdaS3ObjectVersion` accordingly
 