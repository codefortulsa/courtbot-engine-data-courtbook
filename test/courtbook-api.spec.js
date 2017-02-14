import proxyquire from "proxyquire";
import setup from "./setup";

describe("courtbook-api", () => {
    const {expect, chance, sandbox} = setup();

    const courtbookUrl = "https://agile-tundra-30598.herokuapp.com";
    const oauthConfig = {
        tokenUrl: chance.url(),
        audience: chance.url(),
        clientId: chance.guid(),
        clientSecret: chance.guid()
    };
    const token = chance.guid();
    const caseNumber = chance.integer();
    const party = chance.name();

    let courtbookApi, Client, clientCredentialsBearerToken;

    beforeEach(() => {
        clientCredentialsBearerToken = sandbox.stub().returns(Promise.resolve(token));

        Client = function () {
        };
        Client.prototype.post = sandbox.stub();

        const CourtbookApi = proxyquire("../src/courtbook-api", {
            "node-rest-client": {Client},
            "./oauth": {clientCredentialsBearerToken}
        }).default;
        courtbookApi = new CourtbookApi({courtbookUrl, oauthConfig});
    });

    describe("getEvents", () => {
        it("should resolve with events", () => {
            const expectedEvents = chance.n(() => ({
                date: chance.date(),
                description: chance.sentence()
            }), 3);

            Client.prototype.get = sandbox.spy((url, data, cb) => cb(expectedEvents));

            const promise = courtbookApi.getEvents(caseNumber, party);

            return expect(promise)
                .to.be.eventually.eql(expectedEvents)
                .then(() => {
                    expect(clientCredentialsBearerToken).to.have.been.calledWith(oauthConfig);
                    expect(Client.prototype.get).to.be.calledWith(
                        `${courtbookUrl}/rest/v1/cases/${caseNumber}/party/${party}/events`,
                        {headers: {Authentication: `Bearer ${token}`}},
                        sandbox.match.func
                    );
                });
        });

        it("should reject when failed to get events", () => {
            Client.prototype.get = sandbox.spy(() => {
                return {on: (msg, cb) => cb()}
            });

            return expect(courtbookApi.getEvents(caseNumber, party))
                .to.be.rejectedWith(`Failed to get events for case ${caseNumber} and party ${party}.`);
        });
    });

    describe("getParties", () => {
        it("should resolve with events", () => {
            const cases = chance.n(() => ({
                id: chance.integer(),
                caseNumber: chance.guid(),
                party: chance.name()
            }), 3);

            Client.prototype.get = sandbox.spy((url, data, cb) => cb(cases));

            const promise = courtbookApi.getParties(caseNumber, party);

            return expect(promise)
                .to.be.eventually.eql(cases.map(c=>c.party))
                .then(() => {
                    expect(clientCredentialsBearerToken).to.have.been.calledWith(oauthConfig);
                    expect(Client.prototype.get).to.be.calledWith(
                        `${courtbookUrl}/rest/v1/cases?caseNumber=${caseNumber}`,
                        {headers: {Authentication: `Bearer ${token}`}},
                        sandbox.match.func
                    );
                });
        });

        it("should reject when failed to get events", () => {
            Client.prototype.get = sandbox.spy(() => {
                return {on: (msg, cb) => cb()}
            });

            return expect(courtbookApi.getParties(caseNumber, party))
                .to.be.rejectedWith(`Failed to get parties for case ${caseNumber}.`);
        });
    });
});
