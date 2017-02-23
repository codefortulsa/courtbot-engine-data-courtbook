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
                client.get(`${this._baseUrl}/rest/v1/cases/${caseNumber}/party/${party}/events`, args, (data) => {
                    try{
                      const jsonData = JSON.parse(data.toString("utf8"));
                      log.trace(`Events for case ${caseNumber} and party ${party}: `, jsonData);
                      resolve(jsonData);
                    }catch (e){
                      log.error("Error parsing case data", data.toString("utf8"), e);
                    }
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
            log.trace("Bearer token:", token);
            return new Promise((resolve, reject) => {
                const args = {
                    headers: {"Authentication": `Bearer ${token}`}
                };
                client.get(`${this._baseUrl}/rest/v1/cases?caseNumber=${caseNumber}`, args,
                    (data) => {
                        try{
                          const jsonData = JSON.parse(data.toString("utf8"));
                          log.trace(`Found cases for case ${caseNumber}:`, jsonData);
                          resolve(jsonData.map(courtCase => courtCase.party));
                        }catch (e){
                          log.error("Error parsing party data", data.toString("utf8"), e);
                        }
                    }).on("error", (error) => {
                        log.error(`Failed to get parties for case ${caseNumber}`, error);
                        reject(new Error(`Failed to get parties for case ${caseNumber}.`));
                });
            });
        });
    }
}

export default CourtbookApi;
