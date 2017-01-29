import setup from './setup';
import {beforeEach, describe, it} from "mocha";
const proxyquire = require("proxyquire").noCallThru();

describe("courtbook data", () => {
  const {sandbox, expect, chance} = setup();

  let courtbot;
  let eventOnStub;

  beforeEach(() => {
    eventOnStub = sandbox.stub();
    courtbot = {
      events: {
        on: eventOnStub
      }
    };
  });

  it("hooks up to the add-routes event", () => {
    proxyquire("../src/index.js", {
      "courtbot-engine": courtbot
    }).default("http://localhost");

    expect(eventOnStub).to.have.been.calledWith("add-routes", sandbox.match.func);
  });

  describe("add-routes event", () => {
    let router;
    let postStub;
    let registrationSource;
    let getRegistrationsByPhoneStub;

    beforeEach(() => {
      postStub = sandbox.stub();
      getRegistrationsByPhoneStub = sandbox.stub();
      registrationSource = {
        getRegistrationsByContact: getRegistrationsByPhoneStub
      };
      router = {
        post: postStub
      };
      eventOnStub.onCall(0).callsArgWith(1, {router, registrationSource});

      proxyquire("../src/index.js", {
        "courtbot-engine": courtbot
      }).default("http://localhost");
    });

    it("adds a /courtbook/register post route", () => {
      expect(postStub).to.have.been.calledWith("/courtbook/register", sandbox.match.func);
    });

    describe("register route", () => {
      let res;
      let req;
      let route;
      let endStub;
      let getRegistrationResolver;
      beforeEach(() => {
        req = {
          body: {
            api_token: chance.guid(),
            name: chance.name(),
            phone: chance.phone(),
            casenumber: "CF-" + chance.year() + "-" + chance.integer({min:1000, max:10000})
          }
        };
        endStub = sandbox.stub();
        res = {
          end: endStub
        };
        var prom = new Promise(function(resolve, reject) {
          getRegistrationResolver = resolve;
        });
        getRegistrationsByPhoneStub.returns(prom);
        route = postStub.args[0][1];
      });

      it("returns an error if the api token is invalid", () =>{
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
        expect(res.end).not.to.have.been.called();
        expect(getRegistrationsByPhoneStub).to.have.been.called();
      });

      it("returns success if the user is already registerd for that case/phone", () => {
        process.env.API_TOKENS = JSON.stringify([req.body.api_token]);
        route(req, res);
        getRegistrationResolver([
          {name: req.body.name, casenumber: req.body.casenumber, state: 3 }
        ]);

        // expect(endStub).to.have.been.calledWith(JSON.stringify({
        //   success: true
        // }));
      });
    });
  });
});
