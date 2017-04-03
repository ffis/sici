/*
usage: mocha testRecalculate.js
*/

/*global describe */
/*global before */
/*global it */
/*global after */
(function(logger){
	'use strict';

	const expect = require('chai').expect,
		should = require('chai').should,

		mongoose = require('mongoose'),
		models = require('../api/models'),
		recalculate = require('../api/recalculate'),
		config = require('../config.json');

	if (typeof describe === 'function'){
		describe('Recalculate Library', function(){

			before(function(){
				mongoose.set('debug', config.mongodb.debug);
				mongoose.Promise = require('q').Promise;
				mongoose.connect(config.mongodb.connectionString);
				models.init(mongoose);
			});

			it('should be able to rebuild permission model', function(done){
				const obj = {'jerarquiaescritura': [1, 1]};
				recalculate.restauraModeloPermiso(models, obj);
				expect(obj).to.have.a.property('jerarquialectura');
				expect(obj).to.have.a.property('jerarquiaescritura');
				expect(obj.jerarquiaescritura.length).to.be.equal(1);
				expect(obj.jerarquialectura.length).to.be.equal(1);
				done();
			});

			it('should be able to rebuild permission model (jerarquiadirectaescritura:1 => jerarquiaescritura.length > 1)', function(done){

				const p = {'jerarquiadirectaescritura': [1, 1]};
				recalculate.softCalculatePermiso(models, p).then(function(obj){

					expect(obj).to.have.a.property('jerarquialectura');
					expect(obj).to.have.a.property('jerarquiaescritura');

					expect(obj.jerarquiaescritura.length).to.be.above(1);
					expect(obj.jerarquialectura.length).to.be.above(1);

					done();
				}).fail(function(err){
					logger.error(err);
				});
			});

			it('should be able to rebuild permission model (jerarquiadirectalectura:1 => jerarquiaescritura.length === 0)', function(done){

				const p = {'jerarquiadirectalectura': [1, 1]};
				recalculate.softCalculatePermiso(models, p).then(function(obj){

					expect(obj).to.have.a.property('jerarquialectura');
					expect(obj).to.have.a.property('jerarquiaescritura');

					expect(obj.jerarquiaescritura.length).to.be.equal(0);
					expect(obj.jerarquialectura.length).to.be.above(1);

					done();
				}).fail(function(err){
					logger.error(err);
				});
			});




			after(function(){
				mongoose.disconnect();
			});
		});
	}

})(console);
