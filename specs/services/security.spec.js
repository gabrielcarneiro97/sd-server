const sinon = require('sinon');

const mongoose = require('mongoose');
const jwtoken = require('jsonwebtoken');

const logger = require('config/logger.js');
const User = mongoose.model('User');
const SecurityService = require('services/security.js');

describe('Security Service', function() {
	let sandbox;

	beforeEach(function() {
		sandbox = sinon.sandbox.create();
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('register user', function() {
		it('register user with success', function(done) {
			let username = 'user';
			let password = 'pwd';

			let loggerStub = sandbox.stub(logger, 'debug');
			sandbox.stub(User.prototype, 'save').yields(null);

			SecurityService.register(username, password, function(err, user) {
				assert(loggerStub.calledWith('New user registered: ' + username));

				assert.isNull(err);
				assert.isNotNull(user);
				assert.equal(user.username, username);
				assert.isNotNull(user.salt);
				assert.isNotNull(user.hash);

				done();
			});
		});

		it('error while registering existing user', function(done) {
			let username = 'user';
			let password = 'pwd';

			sandbox.stub(User.prototype, 'save').yields({
				code: 11000
			});

			SecurityService.register(username, password, function(err, user) {
				assert.isUndefined(user);
				assert.isNotNull(err);
				assert.equal(err.code, 11000);
				assert.equal(err.name, 'security.register.user.already.exists');

				done();
			});
		});

		it('generic error while registering user', function(done) {
			let username = 'user';
			let password = 'pwd';

			sandbox.stub(User.prototype, 'save').yields({
				name: 'generic.error',
				code: 500
			});

			SecurityService.register(username, password, function(err, user) {
				assert.isUndefined(user);
				assert.isNotNull(err);
				assert.equal(err.code, 500);
				assert.equal(err.name, 'generic.error');

				done();
			});
		});
	});

	describe('renew token', function() {
		it('renew token with success', function(done) {
			let clock = sinon.useFakeTimers();

			let oldToken = '1234567';
			let renewedToken = '7654321';
			let user = {};
			user.username = 'user';
			user.password = 'pwd';

			let loggerStub = sandbox.stub(logger, 'debug');
			let signStub = sandbox.stub(jwtoken, 'sign').returns(renewedToken);
			sandbox.stub(jwtoken, 'verify').yields(null, user);

			SecurityService.renewToken(oldToken, function(err, newToken) {
				assert(loggerStub.calledWith('New token for user: ' + user.username));

				let capturedUser = signStub.getCall(0).args[0];
				let expectedExp = new Date();
				expectedExp.setMinutes(new Date().getMinutes() + 1000);

				assert.equal(capturedUser.username, user.username);
				assert.equal(capturedUser.password, user.password);
				assert.equal(capturedUser.exp, parseInt(expectedExp.getTime() / 1000));

				assert.isNull(err);
				assert.equal(newToken, renewedToken);

				clock.restore();
				done();
			});
		});

		it('sign error while trying to renew token', function(done) {
			let oldToken = '1234567';
			let signError = 'error to sign';

			let loggerStub = sandbox.stub(logger, 'debug');
			sandbox.stub(jwtoken, 'verify').yields(signError);

			SecurityService.renewToken(oldToken, function(err, newToken) {
				assert.isFalse(loggerStub.called);

				assert.equal(err, signError);
				assert.isUndefined(newToken);

				done();
			});
		});
	});
});
