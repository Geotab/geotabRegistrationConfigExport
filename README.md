# MyGeotab Config exporter Add-In

## Overview

Exports groups, rules, reports, dashboards, map providers and addins (exports only configurations, so only addins with files located on remote servers will be exported) into json file that can be imported during registration process.

### Dependencies
* bluebird

## Installation

Install this add-in into MyGeotab application you want to export settings from. Use configuration below:
```
{
	"name": "Registration config",
	"supportEmail": "nickklimkovich@geotab.com",
	"version": "1.0",
	"items": [
		{
			"url": "https://cdn.jsdelivr.net/gh/Geotab/geotabRegistrationConfigExport@master/registrationConfig.html",
			"path": "AdministrationLink/",
			"menuName": {
				"en": "Registration config"
			}
		}
	],
	"isSigned": false
}
```

## Development

Make sure you have [Node.js](https://nodejs.org/) installed.

### Dependencies
* browserify
* tsify
* watchify
* MyGeotabDevTool (recommended)

Get repo, copy it to MyGeotabDevTool/DevTool/addins/ folder and run:
``` 
$> cd RegistrationConfig/_dev
$> npm install
$> npm start
```

Source files are located in _dev/sources folder.

## LICENSE

The MIT License (MIT)

Copyright (c) 2015 Geotab Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
