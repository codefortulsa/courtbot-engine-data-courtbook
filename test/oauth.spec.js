import proxyquire from "proxyquire";
import setup from "./setup";

describe("oauth", () => {
    const {expect, chance, sandbox} = setup();

    let oauth, Client;

    const oauthConfig = {
        tokenUrl: chance.url(),
        audience: chance.url(),
        clientId: chance.guid(),
        clientSecret: chance.guid()
    };

    beforeEach(() => {
        Client = function () {
        };
        Client.prototype.post = sandbox.stub();

        oauth = proxyquire("../src/oauth", {
            "node-rest-client": {Client}
        });
    });

    describe("clientCredentialsBearerToken", () => {
        it("should resolve with bearer token", () => {
            const authResponse = {
                access_token: chance.guid(),
                token_type: "Bearer"
            };

            Client.prototype.post = sandbox.spy((url, data, cb) => cb(authResponse));

            const promise = oauth.clientCredentialsBearerToken(oauthConfig);

            expect(Client.prototype.post).to.be.calledWith(
                oauthConfig.tokenUrl, {
                    data: {
                        audience: oauthConfig.audience,
                        client_id: oauthConfig.clientId,
                        client_secret: oauthConfig.clientSecret,
                        grant_type: "client_credentials"
                    },
                    headers: {"Content-Type": "application/json"}
                },
                sandbox.match.func
            );
            return expect(promise)
                .to.be.eventually.eql(authResponse.access_token);
        });

        it("should reject error authenticating", () => {
            const authResponse = {error_description: "Not Authorized"};

            Client.prototype.post = sandbox.spy((url, data, cb) => cb(authResponse));

            return expect(oauth.clientCredentialsBearerToken(oauthConfig))
                .to.be.rejectedWith(authResponse.error_description);
        });

        it("should reject when post fails", () => {
            Client.prototype.post = sandbox.spy(() => {
                return {
                    on: sandbox.spy((msg, cb) => cb())
                }
            });

            return expect(oauth.clientCredentialsBearerToken(oauthConfig))
                .to.be.rejectedWith("Failed to get auth token");
        });
    });
});
