'use strict';
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.should();
chai.use(sinonChai);
global.expect = chai.expect;
global.assert = chai.assert;
global.request = require('supertest-as-promised');
global.config = require('../config/config');
global.url = global.config.url;
global.faker = require('faker');
global.faker.locale = 'es';
global.baseDir = __dirname + '/..';
global.sinon = require('sinon');