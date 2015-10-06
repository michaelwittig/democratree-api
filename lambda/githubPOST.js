console.log('loading function');
var aws = require('aws-sdk');
var sqs = aws.SQS();

exports.handler = function(event, context) {
	console.log('received event:', JSON.stringify(event, null, 2));
  var message = {
    "action": "create_or_update",
    "repository": {
      "full_name": event.repository.full_name
    }
  };
  sqs.sendMessage({
    "MessageBody": JSON.stringify(message),
    "QueueUrl": "https://sqs.us-east-1.amazonaws.com/089545019273/democratree-worker"
  }, function(err) {
    if (err) {
      context.fail(err);
    } else {
      context.succeed();
    }
  });
};
