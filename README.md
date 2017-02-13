# courtbot-engine-data-courtbook [![Build Status](https://travis-ci.org/codefortulsa/courtbot-engine-data-courtbook.svg?branch=master)](https://travis-ci.org/codefortulsa/courtbot-engine-data-courtbook)

A data source for Courtbot that pulls data from a [Courtbook](https://github.com/codefortulsa/courtbook) instance.

## Configuration

An environment variable must be defined with one or more API tokens. This token is used by a Courtbook instance to talk with a Courtbot instance.

## Usage

From your instance of Courtbot, you just need to register this Courtbot extension with a few configuration settings:

```javascript
import courtbookData from 'courtbot-engine-data-courtbook';

courtbookData({
	courtbookUrl: "https://courtbook",
	oauthConfig: {
		tokenUrl: "https://oauth-provider/url",
       audience: "https://oauth-provider/audience",
       clientId: "<client_id>",
       clientSecret: "<client_secret>"
	}
});
```