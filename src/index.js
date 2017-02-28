import CourtbookApi from "./courtbook-api";
import {events, sendNonReplyMessage, registrationState, verifyContact} from "courtbot-engine";
import log4js from "log4js";

const logger = log4js.getLogger("courtbook");

module.exports = exports = function ({courtbookUrl, oauthConfig}) {
    const courtbookApi = new CourtbookApi({
        courtbookUrl, oauthConfig
    });

    events.on("add-routes", ({router, registrationSource, messageSource}) => {
        router.post("/courtbook/register", (req, res) => {
            if (!process.env.API_TOKENS || JSON.parse(process.env.API_TOKENS).filter(x => x == req.body.api_token).length == 0) {
                logger.debug("Invalid API token.");
                res.writeHead(401, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    success: false,
                    message: "Invalid API token."
                }));
                return;
            }

            verifyContact(req.body.contact, req.body.communication_type).then(contact =>
              registrationSource.getRegistrationsByContact(contact, req.body.communication_type).then(registrations => {
                const existing = registrations.filter(r => r.name == req.body.name && r.case_number == req.body.case_number && r.state != registrationState.UNSUBSCRIBED);
                if (existing.length > 0) {
                    logger.debug("User has an existing registration");
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        success: false,
                        message: "User has an existing registration"
                    }));
                    return;
                }

                registrationSource.createRegistration({
                    contact,
                    communication_type: req.body.communication_type,
                    name: req.body.name,
                    case_number: req.body.case_number,
                    state: registrationState.ASKED_REMINDER
                }).then(() => sendNonReplyMessage(contact, messageSource.remote(req.body.user, req.body.case_number, req.body.name), req.body.communication_type));
                res.writeHead(200, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    success: true,
                    message: "Registration added"
                }));
            }))
            .catch(err => {
              logger.debug("Invalid phone number", err);
              res.writeHead(401, {'Content-Type': 'application/json'});
              res.end(JSON.stringify({
                  success: false,
                  message: "Invalid phone number"
              }));
            });
        });
    });

    events.on("retrieve-parties", (casenumber, result) => {
        result.promises.push(courtbookApi.getParties(casenumber));
    });

    events.on("retrieve-party-events", (casenumber, party, result) => {
        result.promises.push(courtbookApi.getEvents(casenumber, party));
    });
};
