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
        const url = `${this._baseUrl}/api/v1/cases/${caseNumber}/party/${party}/events`;
        log.debug(`Getting events for case ${caseNumber} and party ${party} from URL ${url}`);
        return this._getBearerToken().then(token => {
            return new Promise((resolve, reject) => {
                const args = {
                    headers: {"Authorization": `Bearer ${token}`}
                };
                client.get(url, args, (data) => {
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
        log.debug(`Getting parties for case ${caseNumber}...`);
        return this._getBearerToken().then(token => {
            return new Promise((resolve, reject) => {
                const args = {
                    headers: {"Authorization": `Bearer ${token}`}
                };
                client.get(`${this._baseUrl}/api/v1/cases?caseNumber=${caseNumber}`, args,
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
