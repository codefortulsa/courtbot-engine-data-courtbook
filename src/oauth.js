import log4js from "log4js";
import {Client} from "node-rest-client";

const log = log4js.getLogger("oauth");

const client = new Client();

export const clientCredentialsBearerToken = ({audience, tokenUrl, clientId, clientSecret}) => {
    log.trace(`Getting auth token from ${tokenUrl} using ${clientId} and audience ${audience}.`);
    return new Promise((resolve, reject) => {
        const postData = {
            data: {
                client_id: clientId,
                client_secret: clientSecret,
                audience: audience,
                grant_type: "client_credentials"
            },
            headers: {"Content-Type": "application/json"}
        };

        client.post(tokenUrl, postData, (responseData) =>
            responseData.access_token ? resolve(responseData.access_token) : reject(new Error(responseData.error_description))
        ).on("error", (err) => {
            log.error("Failed to get auth token", err);
            reject(new Error("Failed to get auth token"));
        });
    });
};

