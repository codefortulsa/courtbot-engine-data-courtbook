# courtbot-engine-data-courtbook [![Build Status](https://travis-ci.org/codefortulsa/courtbot-engine-data-courtbook.svg?branch=master)](https://travis-ci.org/codefortulsa/courtbot-engine-data-courtbook)

A data source for Courtbot that pulls data from a [Courtbook](https://github.com/codefortulsa/courtbook) instance.

## Configuration

An environment variable must be defined with one or more API tokens. This token is used by a Courtbook instance to talk with a Courtbot instance.

## Usage

From your instance of Courtbot, you just need to register this Courtbot extension. The Courtbook URL must be your the host followed by `/rest`, e.g., `https://courtbook:5000/rest`.

```
import courtbookData from 'courtbot-engine-data-courtbook';

courtbookData("https://courtbook/rest");
```