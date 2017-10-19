/*
usage: mocha testIndicador.js
*/

/*global describe */
/*global before */
/*global it */
/*global after */
(function(logger){
	'use strict';

	const chai = require('chai'),
		expect = chai.expect,
		should = chai.should,

		mongoose = require('mongoose'),
		models = require('../api/models'),
		cartalib = require('../api/carta'),
		config = require('../config.json');

	if (typeof describe === 'function'){
		describe('Indicador', function(){
			const indicadorid = '56b85a4e518fbc7924521ebf';
			let indicador = false;

			before(function(){
				mongoose.set('debug', config.mongodb.debug);
				mongoose.Promise = require('q').Promise;
				mongoose.connect(config.mongodb.connectionString);
				models.init(mongoose);
			});

			it('should load indicador', function(done){
				models.indicador().findOne({'_id': models.objectId(indicadorid)}).lean().exec().then(function(ind){
					indicador = ind;
					cartalib.recalculateIndicador(indicador, indicador);
					expect(ind).to.have.a.property('nombre');
					expect(ind.nombre).to.be.equal('Tiempo mensual de respuesta de incidencias');
					
					done();
				}, function(err){
					should.not.exist(err);
					logger.error(err);
					done();
				});
			});
			after(function(){
				mongoose.disconnect();
			});
		});
	}

})(console);
