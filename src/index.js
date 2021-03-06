import CourtbookApi from "./courtbook-api";
import {events, sendNonReplyMessage, registrationState, verifyContact, messaging} from "courtbot-engine";
import log4js from "log4js";

const logger = log4js.getLogger("courtbook");

module.exports = exports = function ({courtbookUrl, oauthConfig}) {
    const courtbookApi = new CourtbookApi({
        courtbookUrl, oauthConfig
    });

    events.on("add-routes", ({router, registrationSource}) => {
        router.get("/courtbook/messageLog/:casenumber/:communicationtype/:contact", (req, res) => {
            if (!process.env.API_TOKENS || JSON.parse(process.env.API_TOKENS).filter(x => x == req.query.api_token).length == 0) {
                logger.debug("Invalid API token.", req.body);
                res.writeHead(401, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    success: false,
                    message: "Invalid API token."
                }));
                return;
            }

            verifyContact(req.params.contact, req.params.communicationtype).then(contact =>
                registrationSource.getSentMessages(contact, req.params.casenumber).then(msgs => {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.end(JSON.stringify({
                        success: true,
                        messages: msgs
                    }));
                })
            );
        });
        router.post("/courtbook/register", (req, res) => {
            if (!process.env.API_TOKENS || JSON.parse(process.env.API_TOKENS).filter(x => x == req.body.api_token).length == 0) {
                logger.debug("Invalid API token.", req.body);
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

                return registrationSource.createRegistration({
                    contact,
                    communication_type: req.body.communication_type,
                    name: req.body.name,
                    case_number: req.body.case_number,
                    state: registrationState.ASKED_REMINDER
                }).then(() => sendNonReplyMessage(contact, messaging.remote(req.body.user, req.body.case_number, req.body.name), req.body.communication_type))
                .then(() => {
                  res.writeHead(200, {'Content-Type': 'application/json'});
                  res.end(JSON.stringify({
                      success: true,
                      message: "Registration added",
                      verifiedContact: contact
                  }));
                });
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
