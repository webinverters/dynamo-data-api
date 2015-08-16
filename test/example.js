/**
 * @module myModule
 * @summary: This module's purpose is to:
 *
 * @description:
 *
 * Author: Justin Mooser
 * Created On: 2015-08-16.
 * @license Apache-2.0
 */

"use strict";

var config = require('./config');
console.debug = console.log;

var dynamo = require('../index')(config, console);


return dynamo.init('user');