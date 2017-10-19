/*
usage: mocha testExportadorCarta.js
*/

/*global describe */
/*global before */
/*global it */
/*global after */
(function(logger){
	'use strict';

	var expect = require('chai').expect,
		should = require('chai').should;

	var fs = require('fs'),
		path = require('path'),
		mongoose = require('mongoose'),
		models = require('../api/models'),
		Ec = require('../api/exportador_carta'),
		config = require('../config.json');

	if (typeof describe === 'function'){

		describe('ExportadorCarta', function(){
			var ec,
				cartaid = '56617c4e9aa4f5ea615c1490',
				testfile = '/tmp/testfile.xlsx',
				anualidad = 2015;

			before(function(){
				mongoose.set('debug', config.mongodb.debug);
				mongoose.connect(config.mongodb.connectionString);
				models.init(mongoose);
				ec = new Ec(models, path.join('..', config.templates.xlsxcartas));
				fs.unlink(testfile, function(){});
			});
			it('should load Entidad Objeto', function(done){
				ec.loadEntidadObjeto(cartaid).then(function(obj){
					expect(obj).to.have.a.property('denominacion');
					expect(obj.denominacion).equal('Carta de Servicios de la Dirección General de Producciones y Mercados Agroalimentarios');
					done();
				}, function(err){
					should.not.exist(err);
					logger.error(err);
					done();
				});
			});
			it('should load objetivos', function(done){
				ec.loadObjetivos(cartaid).then(function(objs){
					expect(objs.length).equal(21);
					done();
				}, function(err){
					should.not.exist(err);
					logger.error(err);
					done();
				});
			});
			it('should create an xlsx file', function(done){
				ec.toFile(testfile, cartaid, anualidad).then(function(o){
					logger.log(typeof o);
					/*
					fs.stat(testfile, function(err, st){
						should.not.exist(err);
						should.exist(st);
					});*/
					done();
				}, function(err){
					logger.error(err);
					should.not.exist(err);
					done();
				});
			});
			after(function(){
				mongoose.disconnect();
			});
		});
	} else {
		(function(){
			var ec,
				cartaid = '56617c4e9aa4f5ea615c1490',
				testfile = '/tmp/testfile.xlsx',
				anualidad = 2015;
			mongoose.set('debug', config.mongodb.debug);
			mongoose.connect(config.mongodb.connectionString);
			models.init(mongoose);
			ec = new Ec(models, path.join('..', config.templates.xlsxcartas));
			fs.unlink(testfile, function(){});
			ec.toFile(testfile, cartaid, anualidad)
				.then(function(o){
					logger.log(typeof o);
					/*
					fs.stat(testfile, function(err, st){
						should.not.exist(err);
						should.exist(st);
					});*/
					mongoose.disconnect();
				}, function(err){
					logger.error(err);
					mongoose.disconnect();
				});
		})();
	}
})(console);
