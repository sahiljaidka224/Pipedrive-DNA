// require dotenv for storing credentials securely
const dotenv = require('dotenv');

let Pipedrive = require('pipedrive');
let pipedrive = new Pipedrive.Client(process.env.PIPEDRIVE_API_TOKEN, { strictMode: true });



