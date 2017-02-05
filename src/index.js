import {Client} from 'node-rest-client';
import {events, sendNonReplyMessage, registrationState} from "courtbot-engine";
import log4js from "log4js";

const logger = log4js.getLogger("courtbook");

const client = new Client();

module.exports = exports = function(courtbookUrl) {
  events.on("add-routes", ({router, registrationSource, messageSource}) => {
    router.post("/courtbook/register", (req,res) => {
      if(!process.env.API_TOKENS || JSON.parse(process.env.API_TOKENS).filter(x => x == req.body.api_token).length == 0) {
        logger.debug("Invalid API token.");
        res.end(JSON.stringify({
          success: false,
          message: "Invalid API token."
        }));
        return;
      }

      registrationSource.getRegistrationsByContact(req.body.contact, req.body.communication_type).then(registrations => {
        const existing = registrations.filter(r => r.name == req.body.name && r.case_number == req.body.case_number && r.state != registrationState.UNSUBSCRIBED);
        if(existing.length > 0) {
          logger.debug("User has an existing registration");
          res.end(JSON.stringify({
            success: false,
            message: "User has an existing registration"
          }));
          return;
        }

        registrationSource.createRegistration({
          contact: req.body.contact,
          communication_type: req.body.conversation_type,
          name: req.body.name,
          case_number: req.body.case_number,
          state: registrationState.ASKED_REMINDER
        }).then(() => sendNonReplyMessage(req.body.contact, messageSource.remote(req.body.user, req.body.case_number, req.body.name)));

        res.end(JSON.stringify({
          success: true,
          message: "Registration added"
        }));
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
      client.get(`${courtbookUrl}/v1/cases/cases/${casenumber}/defendant/${party}/events`, function(data) {
        if(data.length == 0) {
          //log.info(`No events found in courtbook for case number ${casenumber} and party ${party}`);
          resolve([]);
        }
        resolve(data);
      });
    }));
  });
};
