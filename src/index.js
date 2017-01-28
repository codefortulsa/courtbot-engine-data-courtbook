import {events} from "courtbot-engine";

events.on("add-routes", ({router, registrationSource}) => {
  router.post("/courtbook/register", (req,res) => {

    if(JSON.parse(process.env.API_TOKENS).filter(x => x == req.body.api_token).length == 0) {
      res.end(JSON.stringify({
        success: false,
        message: "Invalid API token."
      }));
      return;
    }

    registrationSource.getRegistrationsByPhone(req.phone).then(() => {
      
    });
  });
});
