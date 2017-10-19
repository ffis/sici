/*
usage: env TESTUSER=carmuser mocha testWs.js
*/

/*global describe */
/*global before */
/*global it */
/*global after */
(function(process, logger){
	'use strict';
	var expect = require('chai').expect;

	var Q = require('q'),
		mongoose = require('mongoose'),
		models = require('../api/models'),
		persona = require('../api/persona'),
		config = require('../config.json');

	mongoose.Promise = require('q').Promise;

	if (typeof describe === 'function')
	{
		describe('CARM WS', function(){
			var login = process.env.TESTUSER && process.env.TESTUSER !== '' ? process.env.TESTUSER : 'mla25p',
				cfg;
			before(function(){
				mongoose.set('debug', config.mongodb.debug);
				mongoose.connect(config.mongodb.connectionString);
				models.init(mongoose);
			});
			it('should load configuration for the WS from the mongodb database', function(done){
				var Settings = models.settings();

				Settings
					.find()
					.sort({'version': -1}).limit(1).exec(function (err, cfgs) {
						expect(err).to.be.null;
						expect(cfgs.length).to.not.equal(0);
						cfg = cfgs[0];
						done();
					});
			});
			it('should be able to retrieve information using the login name', function(done){
				expect(login).to.not.equal('');

				persona
					.infoByLogin(login, cfg)
					.then(function(data){

						logger.dir('Answer from WS: ');
						logger.dir(data);
						expect(data).to.exist;
						expect(data.return).to.exist;
						expect(data.return.length).to.be.above(0);
						if (data.return.length > 0){
							for (var i = 0, j = data.return.length; i < j; i++){
								if (data.return[i].key === 'ERR_MSG'){
									expect(data.return[i].value).not.to.exist;
								}
							}
						}
						done();
					}, function(err){
						logger.error(err);
					});
			});
			it('should be able to retrieve information using the login name', function(done){
				expect(login).to.not.equal('');

				persona
					.infoByPlaza(login, cfg)
					.then(function(data){

						logger.dir('Answer from WS: ');
						logger.dir(data);
						expect(data).to.exist;
						expect(data.return).to.exist;
						expect(data.return.length).to.be.above(0);
						if (data.return.length > 0){
							for (var i = 0, j = data.return.length; i < j; i++){
								if (data.return[i].key === 'ERR_MSG'){
									expect(data.return[i].value).not.to.exist;
								}
							}
						}
						done();
					}, function(err){
						logger.error(err);
					});
			});
			after(function(){
				mongoose.connection.close();
			});

		});
	}
})(process, console);
