require('dotenv').config();
const AWS = require('aws-sdk');

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS credentials in environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)');
}

AWS.config.update({
    region,
    accessKeyId,
    secretAccessKey
});

module.exports = AWS;