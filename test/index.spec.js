import setup from "./setup";
import {beforeEach, describe, it} from "mocha";
const proxyquire = require("proxyquire").noCallThru();

describe("courtbot-engine-data-courtbook index", () => {
    const {sandbox, expect, chance} = setup();

    const validConfiguration = {
        courtbookUrl: "https://agile-tundra-30598.herokuapp.com/rest"
    };

    let courtbot;
    let eventOnStub;
    let verifyContactStub;

    beforeEach(() => {
        eventOnStub = sandbox.stub();
        verifyContactStub = sandbox.stub();
        courtbot = {
            events: {
                on: eventOnStub
            }
        };
    });

    it("hooks up to the add-routes event", () => {
        proxyquire("../src/index.js", {
            "courtbot-engine": courtbot
        })(validConfiguration);

        expect(eventOnStub).to.have.been.calledWith("add-routes", sandbox.match.func);
    });

    describe("add-routes event", () => {
        let router;
        let postStub;
        let getStub;
        let registrationSource;
        let getRegistrationsByPhoneStub;

        beforeEach(() => {
            getStub = sandbox.stub();
            postStub = sandbox.stub();
            getRegistrationsByPhoneStub = sandbox.stub();
            registrationSource = {
                getRegistrationsByContact: getRegistrationsByPhoneStub
            };
            router = {
                post: postStub,
                get: getStub
            };
            eventOnStub.onCall(0).callsArgWith(1, {router, registrationSource});

            courtbot.verifyContact = verifyContactStub;
            proxyquire("../src/index.js", {
                "courtbot-engine": courtbot
            })("http://localhost");
        });

        it("adds a /courtbook/register post route", () => {
            expect(postStub).to.have.been.calledWith("/courtbook/register", sandbox.match.func);
        });

        describe("register route", () => {
            let res;
            let req;
            let route;
            let endStub, writeHead;
            let getRegistrationResolver;
            beforeEach(() => {
                req = {
                    body: {
                        api_token: chance.guid(),
                        name: chance.name(),
                        contact: chance.phone(),
                        communication_type: "sms",
                        casenumber: "CF-" + chance.year() + "-" + chance.integer({min: 1000, max: 10000})
                    }
                };
                verifyContactStub.returns(Promise.resolve(req.body.contact));
                endStub = sandbox.stub();
                writeHead = sandbox.stub();
                res = {
                    end: endStub,
                    writeHead: writeHead
                };
                var prom = new Promise(function (resolve) {
                    getRegistrationResolver = resolve;
                });
                getRegistrationsByPhoneStub.returns(prom);
                route = postStub.args[0][1];
            });

            it("returns an error if the api token is invalid", () => {
                process.env.API_TOKENS = JSON.stringify(["TOKEN_1"]);
                route(req, res);

                expect(res.end).to.have.been.calledWith(JSON.stringify({
                    success: false,
                    message: "Invalid API token."
                }));
            });

            it("gets the current registrations if the api token is valid", () => {
                process.env.API_TOKENS = JSON.stringify([req.body.api_token]);
                route(req, res);

                return new Promise(function(resolve) {
                  setTimeout(function() {
                    expect(res.end).not.to.have.been.called();
                    expect(getRegistrationsByPhoneStub).to.have.been.called();
                    resolve();
                  }, 0);
                });
            });

            it("returns success if the user is already registerd for that case/phone", () => {
                process.env.API_TOKENS = JSON.stringify([req.body.api_token]);
                route(req, res);
                getRegistrationResolver([
                    {name: req.body.name, casenumber: req.body.casenumber, state: 3}
                ]);

                // expect(endStub).to.have.been.calledWith(JSON.stringify({
                //   success: true
                // }));
            });
        });
    });
});
