// require express for server configuration
const express = require('express');

// create a variable from express, to start the server
const app = express();

// create a variable from request, to make HTTP or HTTPs requests
const request = require('request');

// require dotenv for getting data from .env files
const dotenv = require('dotenv');

// require xlsx for reading data from excel sheet
const XLSX = require('xlsx');

const readableWorkbook = XLSX.readFile('Duplicates.xlsx');
const sheet_name_list = readableWorkbook.SheetNames;
let readableData = XLSX.utils.sheet_to_json(readableWorkbook.Sheets[sheet_name_list[0]]);
const baseParam = 'https://api.pipedrive.com/v1/';
let apiToken = 'api_token=' + process.env.PIPEDRIVE_API_TOKEN;

let dealsData = [];
let duplicatesName = [];
let moreItems = true;

const pipeline = '';

async function searchUserInPipeDrive(userName, userEmail) {

    console.log(userName);

    return new Promise((resolve, reject) => {
        let urlParam = baseParam + 'searchResults?term=' + userName + '&exact_match=1&start=0&' + apiToken;

        urlParam = encodeURI(urlParam);

        setTimeout(() => {

            request({url: urlParam}, (err, resp, body) => {
                if (err) reject(err);

                let parsedBody = JSON.parse(body);

                if (parsedBody.hasOwnProperty('success')) {
                    if (parsedBody['success']) {
                        if (parsedBody['data']) {
                            let totalDeals = parsedBody['data'].filter(deal => deal.type === 'deal');

                            if (totalDeals.length > 1) {
                                let totalDealsObj = totalDeals[0];
                                let details = totalDealsObj['details'];
                                duplicatesName.push(details['person_name']);

                                resolve(parsedBody);
                            }

                            let totalPerson = parsedBody['data'].filter(person => person.type === 'person');

                            if (totalPerson.length > 1) {

                                let totalPersonsObj = totalPerson[0];
                                let details = totalPersonsObj['details'];
                                let personName = details['person_name'] ? details['person_name'] : totalPersonsObj['title'];
                                duplicatesName.push(personName);

                                resolve(parsedBody);
                            }

                            if (totalDeals.length === 1 && totalPerson.length === 1) {

                                resolve(parsedBody);
                            }


                        }
                    }
                }

            })
        }, 1000)

    });

}

async function getAllPipelines() {

    return new Promise((resolve, reject) => {

        let urlParam = baseParam + 'pipelines?' + apiToken;

        setTimeout(() => {

            request({url: urlParam}, (err, resp, body) => {
                if (err) reject(err);

                let parsedObj = JSON.parse(body);
                if (parsedObj.hasOwnProperty('success')) {
                    if (parsedObj['success']) {
                        if (parsedObj.hasOwnProperty('data')) {
                            resolve(parsedObj['data']);
                        }
                    }
                }
            })
        }, 1000);
    })
}


async function getDealsInAPipeLine(pipelineId, stageId, start) {

    return new Promise((resolve, reject) => {

        let urlParam = baseParam + 'pipelines/' + pipelineId + '/deals?stage_id=' + stageId + '&start=' + start + '&' + apiToken;

        setTimeout(() => {

            request({url: urlParam}, async (err, resp, body) => {
                if (err) reject(err);

                let parsedObj = JSON.parse(body);
                if (parsedObj.hasOwnProperty('success')) {
                    if (parsedObj['success']) {
                        if (parsedObj.hasOwnProperty('data')) {
                            dealsData.push(...parsedObj['data']);
                        }

                        if (parsedObj.hasOwnProperty('additional_data')) {
                            const additionalData = parsedObj['additional_data'];

                            if (additionalData.hasOwnProperty('pagination')) {
                                const pagination = additionalData['pagination'];

                                if (pagination.hasOwnProperty('more_items_in_collection')) {
                                    if (pagination['more_items_in_collection']) {

                                        //dealsData['more_items_in_collection'] = pagination['more_items_in_collection'];
                                        //dealsData['next_start'] = pagination['next_start'];

                                        resolve([dealsData, pagination['more_items_in_collection'], pagination['next_start']]);
                                    } else {
                                        resolve([dealsData, false, 0]);
                                    }
                                }
                            }
                        }
                    }
                }

            })

        }, 1000);
    })
}


(async () => {

    dotenv.config();
    apiToken = 'api_token=' + process.env.PIPEDRIVE_API_TOKEN;
    await getAllPipelines();

    let start = 0;
    while (moreItems) {
        await getDealsInAPipeLine(20, 249, start)
            .then((data) => {
                console.log("Resolved");
                moreItems = data[1];
                start = data[2];
                console.log(data);
            });
    }

    for (let i = 0; i < dealsData.length; i++) {
        let dealsObj = dealsData[i];
        if (dealsObj.hasOwnProperty('person_name')) {
            await searchUserInPipeDrive(dealsObj['person_name'], '');
        }
    }


})();

