console.log('loading function');
var aws = require('aws-sdk');
var crypto = require('crypto');

var sqs = new aws.SQS();
var dynamodb = new aws.DynamoDB();

function send(message, context) {
  console.log("send:", JSON.stringify(message, null, 2));
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

function calcDigest(key, blob) {
  return 'sha1=' + crypto.createHmac('sha1', key).update(blob).digest('hex');
}

exports.handler = function(event, context) {
  console.log('received event:', JSON.stringify(event)); // TODO debug only
  var body = event.body;
  var header = event.header;
  var hook = event.hook;
  var digest = calcDigest("test1234", JSON.stringify(body));
  if (header['X-Hub-Signature'] !== digest) {
    //context.fail(new Error("digest wrong"));
    //return;
    console.log("digest wrong"); // TODO flip to other implementation
  }
  if (header['X-Github-Event'] === 'create' && body.ref_type === 'tag' && body.pusher !== undefined) {
    send({
      "action": "create_version",
      "version": body.ref.substr(10),
      "repository": {
        "full_name": body.repository.full_name
      },
      "user": {
        "email": body.pusher.email
      }
    }, context);
  } else if (header['X-Github-Event'] === 'push' && body.repository !== undefined && body.pusher !== undefined) {
    send({
      "action": "create_or_update",
      "repository": {
        "full_name": body.repository.full_name
      },
      "user": {
        "email": body.pusher.email
      }
    }, context);
  } else {
    console.log('I only support certain events, but not:', JSON.stringify(event, null, 2));
    context.succeed();
  }
};
