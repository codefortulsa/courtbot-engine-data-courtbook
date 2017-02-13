require("babel-register");
const CourtbookApi = require("./src/courtbook-api");

const courtbookUrl = "https://agile-tundra-30598.herokuapp.com/rest";
const secret = "8EefT4_HwdURIdRGr1qJbk233E4OrkbUyqEl5ucaSm9KH42m_WjgzsD5B3Irh5NT";
const clientId = "ahNgTfXDkMU7otBZf7MaWag5n5b7JKOI";
const audience = "https://ashlux.auth0.com/api/v2/";
const tokenUrl = "https://ashlux.auth0.com/oauth/token";

const api = new CourtbookApi(courtbookUrl, );
api.getEvents("COURTBOT", "Ash Lux")
    .then(events => console.info("Events", events),
        err => console.info("ERROR", err));
