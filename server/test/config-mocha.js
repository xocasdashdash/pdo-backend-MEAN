'use strict';
var chai = require('chai');
var chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
chai.should();
global.expect = chai.expect;
global.assert = chai.assert;
global.request = require('supertest-as-promised');
global.config = require('../config/config');