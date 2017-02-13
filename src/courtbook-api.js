import {Client} from "node-rest-client";
import log4js from "log4js";
import {clientCredentialsBearerToken} from "./oauth";

const client = new Client();

const log = log4js.getLogger("courtbook");

const bearerTokenFunc = (oauthConfig) =>
    () => clientCredentialsBearerToken(oauthConfig);

class CourtbookApi {
    constructor({courtbookUrl, oauthConfig}) {
        this._baseUrl = courtbookUrl;
        this._getBearerToken = bearerTokenFunc(oauthConfig);
    }

    getEvents(caseNumber, party) {
        log.trace(`Getting events for case ${caseNumber} and party ${party}...`);
        return this._getBearerToken().then(token => {
            return new Promise((resolve, reject) => {
                const args = {
                    headers: {"Authentication": `Bearer ${token}`}
                };
                client.get(`${this._baseUrl}/v1/cases/${caseNumber}/party/${party}/events`, args, (data) => {
                    log.trace(`Events for case ${caseNumber} and party ${party}: `, data);
                    resolve(data);
                }).on("error", (error) => {
                    log.error(`Failed to get events for case ${caseNumber} and party ${party}: `, error);
                    reject(new Error(`Failed to get events for case ${caseNumber} and party ${party}.`))
                });
            });
        });
    }

    getParties(caseNumber) {
        log.trace(`Getting parties for case ${caseNumber}...`);
        return this._getBearerToken().then(token => {
            return new Promise((resolve, reject) => {
                const args = {
                    headers: {"Authentication": `Bearer ${token}`}
                };
                client.get(`${this._baseUrl}/v1/cases?caseNumber=${caseNumber}`, args,
                    (data) => {
                        log.trace(`Found cases for case ${caseNumber}:`, data);
                        resolve(data.map(courtCase => courtCase.party));
                    }).on("error", (error) => {
                        log.error(`Failed to get parties for case ${caseNumber}`, error);
                        reject(new Error(`Failed to get parties for case ${caseNumber}.`));
                });
            });
        });
    }
}

export default CourtbookApi;
