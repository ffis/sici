/*
usage: mocha testCache.js
*/

/*global describe */
/*global before */
/*global it */
/*global after */
(function(process, logger){
	'use strict';
	var expect = require('chai').expect;

	var mongoose = require('mongoose'),
		models = require('../api/models'),
		Cache = require('../api/cache'),
		config = require('../config.json');

	mongoose.Promise = require('q').Promise;

	if (typeof describe === 'function'){
		describe('Cache', function(){

			before(function(){
				mongoose.set('debug', config.mongodb.debug);
				mongoose.connect(config.mongodb.connectionString);
				models.init(mongoose);
			});
			it('should be able to cache and retrieve a mongoose model', function(done){
				const cachePersonas = new Cache(models.persona(), 'login');
				cachePersonas.loaded.then(function(){
					const personas = cachePersonas.get('mla25p');
					expect(personas.length).to.equal(1);
					done();
				}, logger.error);

			});

			after(function(){
				mongoose.connection.close();
			});

		});
	}
})(process, console);
