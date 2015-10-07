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

function getHook(hook, cb) {
  dynamodb.getItem({
    "Key": {
      "hook": {
        "S": hook
      }
    },
    "TableName": "democratree-hook"
  }, function(err, data) {
    if (err) {
      cb(err);
    } else {
      if (data.Item === undefined) {
        cb(new Error("hook not found"));
      } else {
        cb(null, {secret: data.Item.secret.S, user: {email: data.Item.email.S}});
      }
    }
  });
}

exports.handler = function(event, context) {
  console.log('received event:', JSON.stringify(event)); // TODO debug only
  var body = event.body;
  var header = event.header;
  getHook(event.hook, function(err, hook) {
    if (err) {
      context.fail(err);
    } else {
      var digest = calcDigest(hook.secret, JSON.stringify(body));
      if (header['X-Hub-Signature'] === digest) {
        if (header['X-Github-Event'] === 'create' && body.ref_type === 'tag' && body.repository !== undefined) {
          send({
            "action": "create_version",
            "version": body.ref,
            "repository": {
              "full_name": body.repository.full_name
            },
            "user": {
              "email": hook.user.email
            }
          }, context);
        } else if (header['X-Github-Event'] === 'push' && body.repository !== undefined) {
          send({
            "action": "create_or_update",
            "repository": {
              "full_name": body.repository.full_name
            },
            "user": {
              "email": hook.user.email
            }
          }, context);
        } else {
          console.log('I only support certain events, but not:', JSON.stringify(event, null, 2));
          context.succeed();
        }
      } else {
        context.fail(new Error("digest wrong"));
      }
    }
  });
};
