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

	var fs = require('fs'), path = require('path'),
		mongoose = require('mongoose'),
		models = require('../api/models'),
		Ei = require('../api/exportador_indicador'),
		config = require('../config.json');

	if (typeof describe === 'function')
	{
		describe('ExportadorCarta', function(){
			var ei,
				testfile = '/tmp/testfile.xlsx';

			before(function(){
				mongoose.set('debug', config.mongodb.debug);
				mongoose.connect(config.mongodb.connectionString);
				models.init(mongoose);
				ei = new Ei(models, path.join('..', config.templates.xlsxcartas));
				fs.unlink(testfile, function(){});
			});

			it('should load indicadores', function(done){
				ei.loadIndicadores().then(function(){
					done();
				}, function(err){
					logger.error(err);
					should(err).not.exist;
					done();
				});
			});

			it('should load objetivos', function(done){
				ei.loadObjetivos().then(function(obs){
					logger.log(Object.keys(obs).length);
					done();
				}, function(err){
					logger.error(err);
					should(err).not.exist;
					done();
				});
			});

			it('should create an xlsx file', function(done){
				ei.toFile(testfile, 'mla25p').then(function(o){
					logger.log(typeof o);
					done();
				}, function(err){
					logger.error(err);
					should(err).not.exist;
					done();
				});
			});
			after(function(){
				mongoose.disconnect();
			});
		});
	} else {
		(function(){
			var ei,
				testfile = '/tmp/testfile.xlsx';
			mongoose.set('debug', config.mongodb.debug);
			mongoose.connect(config.mongodb.connectionString);
			models.init(mongoose);
			ei = new Ei(models, path.join('..', config.templates.xlsxcartas));
			fs.unlink(testfile, function(){});
			ei.toFile(testfile, 'mla25p')
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
					should(err).not.exist;
					mongoose.disconnect();
				});
		})();
	}
})(console);