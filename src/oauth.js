import {Client} from "node-rest-client";

const client = new Client();

export const clientCredentialsBearerToken = ({tokenUrl, audience, clientId, clientSecret}) => {
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
        ).on("error", () => reject(new Error("Failed to get auth token")));
    });
};
