console.log('loading function');
var aws = require('aws-sdk');
var sqs = new aws.SQS();

function send(message, context) {
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
}

exports.handler = function(event, context) {
	console.log('received event:', JSON.stringify(event, null, 2));
  if (event.ref_type === 'tag' && event.pusher !== undefined) {
    send({
      "action": "create_version",
      "version": event.ref.substr(10),
      "repository": {
        "full_name": event.repository.full_name
      },
      "user": {
        "email": event.pusher.email
      }
    }, context);
  } else if (event.repository !== undefined && event.pusher !== undefined && event.action === undefined) {
    send({
      "action": "create_or_update",
      "repository": {
        "full_name": event.repository.full_name
      },
      "user": {
        "email": event.pusher.email
      }
    }, context);
  } else {
    console.log('I only support push events');
    context.succeed();
  }
};
