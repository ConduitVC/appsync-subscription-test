const { bootstrapAWS } = require('@conduitvc/aws-utils');
const loadConfig = require('@conduitvc/config');
const aws = require('aws-sdk');

const { dynamodb } = loadConfig();

(async () => {
  try {
    await bootstrapAWS({
      dynamodb: new aws.DynamoDB(dynamodb),
      tables: { QuoteRequestTable: 'QuoteRequest', QuoteResponseTable: 'QuoteResponse' },
    });
  } catch (e) {
    // eslint-disable-line no-console
    console.log(e);
  } finally {
    process.exit(0);
  }
})();
