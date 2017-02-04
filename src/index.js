import {events, sendNonReplyMessage, registrationState} from "courtbot-engine";
import log4js from "log4js";
const logger = log4js.getLogger("courtbook");

module.exports = exports = function(courtbookUrl) {
  events.on("add-routes", ({router, registrationSource}) => {
    router.post("/courtbook/register", (req,res) => {
      if(!process.env.API_TOKENS || JSON.parse(process.env.API_TOKENS).filter(x => x == req.body.api_token).length == 0) {
        logger.debug("###################");
        logger.debug("req", req);
        logger.debug("res", res);
        logger.debug("Bad API token", req.body, process.env.API_TOKENS ? JSON.parse(process.env.API_TOKENS) : "no tokens" );
        res.end(JSON.stringify({
          success: false,
          message: "Invalid API token."
        }));
        return;
      }

      registrationSource.getRegistrationsByContact(req.contact, req.communication_type).then(registrations => {
        const existing = registrations.filter(r => r.name == req.name && r.case_number == req.case_number && r.state != registrationState.UNSUBSCRIBED);
        if(existing.length > 1) {
          res.end(JSON.stringify({
            success: false,
            message: "User has an existing registration"
          }));
          return;
        }

        if(existing.length == 1) {
          res.end(JSON.stringify({
            success: true
          }));
          return;
        }

        registrationSource.createRegistration({
          contact: req.contact,
          communication_type: req.conversation_type,
          name: req.name,
          case_number: req.case_number,
          state: registrationState.ASKED_REMINDER
        }).then(() => sendNonReplyMessage(req.contact, messageSource.remote(req.user, req.case_number, req.name)));
      });
    });
  });

  events.on("retrieve-parties", (casenumber, result) => {
    const url = `${courtbookUrl}/v1/cases/caseNumber=${casenumber}`;
    //log.debug(`Attempting to retrieve parties for casenumber ${casenumber}`);
    //log.debug(`using url: ${url}`)
    result.promises.push(new Promise(function(resolve) {
      client.get(url, function(data) {
        if(!data || data.length == 0) {
          //log.info(`No defendants found in courtbook for case number ${casenumber}`);
          resolve([]);
        }
        resolve(data.map(x => x.defendant));
      });
    }));
  });

  events.on("retrieve-party-events", (casenumber, party, result) => {
    result.promises.push(new Promise(function(resolve) {
      client.get(`${oscnApiUrl}/v1/cases/cases/${casenumber}/defendant/${party}/events`, function(data) {
        if(data.length == 0) {
          //log.info(`No events found in courtbook for case number ${casenumber} and party ${party}`);
          resolve([]);
        }
        resolve(data);
      });
    }));
  });
};
