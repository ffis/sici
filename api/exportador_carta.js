/*global assert */

const assert = require('assert');
(function(module, logger, assert){
	'use strict';
	var XLSX = require('xlsx'),
		Q = require('q');
/*
	function Workbook() {
		if (!(this instanceof Workbook)){
			var r = new Workbook();
			r.SheetNames = [];
			r.Sheets = [];
			return r;
		}
		this.SheetNames = [];
		this.Sheets = {};
	}
*/
	function ExportadorCartas(models, templatefile){
		this.models = models;
		this.models.entidadobjetomodel = this.models.entidadobjeto();
		this.models.objetivomodel = this.models.objetivo();
		this.models.jerarquiamodel = this.models.jerarquia();
		this.models.indicadormodel = this.models.indicador();
		this.templatefile = templatefile;
	}

	function getCell(worksheet, path, type){
		if (typeof worksheet[path] !== 'object'){
			worksheet[path] = {};
			if (typeof type === 'undefined'){
				worksheet[path] = { v: '', t: 's'};
			}else {
				worksheet[path] = { v: '', t: type};
			}
		}
		return worksheet[path];
	}

	ExportadorCartas.prototype.loadEntidadObjeto = function(entidadobjetoid) {
		var defer = Q.defer();
		this.models.entidadobjetomodel.findOne({_id: entidadobjetoid}).then(function(o){
			defer.resolve(o);
		}, function(err){
			defer.reject(err);
		});
		return defer.promise;
	};

	ExportadorCartas.prototype.loadObjetivos = function(cartaid){
		var restriccion = { 'carta': cartaid };
		var defer = Q.defer();
		this.models.objetivomodel.find(restriccion).sort({'index': 1}).then(function(o){
			defer.resolve(o);
		}, function(err){
			defer.reject(err);
		});
		return defer.promise;
	};

	ExportadorCartas.prototype.loadIndicadores = function(jerarquiaid){
		var restriccion = { 'idjerarquia': parseInt(jerarquiaid) };
		var defer = Q.defer();
		this.models.indicadormodel.find(restriccion).then(function(o){
			var by_Id = {};
			for(var i = 0, j = o.length; i < j; i++){
				by_Id[ o[i]._id ] = o[i];
			}
			defer.resolve(by_Id);
		}, function(err){
			defer.reject(err);
		});
		return defer.promise;
	};

	ExportadorCartas.prototype.loadJerarquias = function(jerarquiaid){
		var restriccion = { 'id': parseInt(jerarquiaid) };
		var defer = Q.defer(),
			instance = this;
		instance.models.jerarquiamodel.findOne(restriccion).exec().then(function(o){
			logger.log(o);
			if (typeof o === 'object'){
				if (typeof o.ancestros === 'object' && o.ancestros.length > 0){
					restriccion = { 'id': {$in: o.ancestros} };

					instance.models.jerarquiamodel.find(restriccion).select('nombrelargo id').exec().then(function(ancestros){
						logger.log(ancestros);
						if (typeof ancestros !== 'object'){
							defer.reject({ error: 'ancestros no ha podido cargarse'});
						} else {
							/* hay que ordenarlos */
							var elems = [];
							for (var i = 0, j = o.ancestros.length; i < j; i++){
								for (var k = 0, l = ancestros.length; k < l; k++){
									if (o.ancestros[i] === ancestros[k].id){
										elems.push(ancestros[k]);
										break;
									}
								}
							}
							defer.resolve( {jerarquia: o, jerarquias: elems } );
							return;
						}
					}, function(error){
						logger.log(error);
						defer.reject(error);
					});
					return;
				}
			}
			defer.resolve( {jerarquia: o, jerarquias: []});
		}, function(err){
			defer.reject(err);
		});
		return defer.promise;
	};

	function monthRow(worksheet, fila, anualidad){
		getCell(worksheet, 'C' + fila).v = 'E';
		getCell(worksheet, 'D' + fila).v = 'F';
		getCell(worksheet, 'E' + fila).v = 'M';
		getCell(worksheet, 'F' + fila).v = 'A';
		getCell(worksheet, 'G' + fila).v = 'M';
		getCell(worksheet, 'H' + fila).v = 'J';
		getCell(worksheet, 'I' + fila).v = 'J';
		getCell(worksheet, 'J' + fila).v = 'A';
		getCell(worksheet, 'K' + fila).v = 'S';
		getCell(worksheet, 'L' + fila).v = 'O';
		getCell(worksheet, 'M' + fila).v = 'N';
		getCell(worksheet, 'N' + fila).v = 'D';
		getCell(worksheet, 'O' + fila).v = anualidad;
	}

	function valueRow(worksheet, fila, anualidad, indicador){
		var datos = indicador.valores['a' + anualidad];
		datos[0] ? getCell(worksheet, 'C' + fila, 'n').v = datos[0] : '';
		datos[1] ? getCell(worksheet, 'D' + fila, 'n').v = datos[1] : '';
		datos[2] ? getCell(worksheet, 'E' + fila, 'n').v = datos[2] : '';
		datos[3] ? getCell(worksheet, 'F' + fila, 'n').v = datos[3] : '';
		datos[4] ? getCell(worksheet, 'G' + fila, 'n').v = datos[4] : '';
		datos[5] ? getCell(worksheet, 'H' + fila, 'n').v = datos[5] : '';
		datos[6] ? getCell(worksheet, 'I' + fila, 'n').v = datos[6] : '';
		datos[7] ? getCell(worksheet, 'J' + fila, 'n').v = datos[7] : '';
		datos[8] ? getCell(worksheet, 'K' + fila, 'n').v = datos[8] : '';
		datos[9] ? getCell(worksheet, 'L' + fila, 'n').v = datos[9] : '';
		datos[10] ? getCell(worksheet, 'M' + fila, 'n').v = datos[10] : '';
		datos[11] ? getCell(worksheet, 'N' + fila, 'n').v = datos[11] : '';
		datos[12] ? getCell(worksheet, 'O' + fila, 'n').v = datos[12] : '';
	}

	function valueRowFormula(worksheet, fila, anualidad, formula){
		var datos = formula.valores['a' + anualidad];
		datos[0] && datos[0].resultado ? getCell(worksheet, 'C' + fila, 'n').v = datos[0].resultado : '';
		datos[1] && datos[1].resultado ? getCell(worksheet, 'D' + fila, 'n').v = datos[1].resultado : '';
		datos[2] && datos[2].resultado ? getCell(worksheet, 'E' + fila, 'n').v = datos[2].resultado : '';
		datos[3] && datos[3].resultado ? getCell(worksheet, 'F' + fila, 'n').v = datos[3].resultado : '';
		datos[4] && datos[4].resultado ? getCell(worksheet, 'G' + fila, 'n').v = datos[4].resultado : '';
		datos[5] && datos[5].resultado ? getCell(worksheet, 'H' + fila, 'n').v = datos[5].resultado : '';
		datos[6] && datos[6].resultado ? getCell(worksheet, 'I' + fila, 'n').v = datos[6].resultado : '';
		datos[7] && datos[7].resultado ? getCell(worksheet, 'J' + fila, 'n').v = datos[7].resultado : '';
		datos[8] && datos[8].resultado ? getCell(worksheet, 'K' + fila, 'n').v = datos[8].resultado : '';
		datos[9] && datos[9].resultado ? getCell(worksheet, 'L' + fila, 'n').v = datos[9].resultado : '';
		datos[10] && datos[10].resultado ? getCell(worksheet, 'M' + fila, 'n').v = datos[10].resultado : '';
		datos[11] && datos[11].resultado ? getCell(worksheet, 'N' + fila, 'n').v = datos[11].resultado : '';
		datos[12] && datos[12].resultado ? getCell(worksheet, 'O' + fila, 'n').v = datos[12].resultado : '';
	}

	function fulfillFormula(worksheet, formula, fila, anualidad, indicadores){
		var indicador,
			i = 0, j = 0;
		getCell(worksheet, 'B' + fila).v = formula.human;
		fila++;
		monthRow(worksheet, fila, anualidad);
		fila++;
		for (i = 0, j = formula.indicadores.length; i < j; i++, fila++){
			if (typeof indicadores[ formula.indicadores[i] ] === 'object'){
				indicador = indicadores[ formula.indicadores[i] ];
				getCell(worksheet, 'B' + fila).v = indicador.nombre;
				valueRow(worksheet, fila, anualidad, indicador);
			} else {
				console.error('No se ha cargado:', formula.indicadores[i], indicadores);
			}
		}
		fila++;
		valueRowFormula(worksheet, fila, anualidad, formula);
		fila++;
		getCell(worksheet, 'B' + fila).v = 'META PARCIAL'; fila++;
		getCell(worksheet, 'B' + fila).v = 'SUMA PARCIAL /CÁLCULO'; fila++;
		getCell(worksheet, 'B' + fila).v = 'VALOR EVALUACION'; fila++;

		return fila + 1;
	}

	function fulfillObjetivo(worksheet, objetivo, filainicial, anualidad, indicadores){
		logger.log(objetivo.denominacion);
		getCell(worksheet, 'A' + filainicial).v = objetivo.index;
		getCell(worksheet, 'B' + filainicial).v = objetivo.denominacion;
		filainicial += 2;
		for (var i = 0, j = objetivo.formulas.length; i < j; i++){
			filainicial = fulfillFormula(worksheet, objetivo.formulas[i], filainicial, anualidad, indicadores);
		}
		return filainicial;
	}


	function fulfillSheet(worksheet, datos){
		var i = 0, j = 0, fila;
		assert(typeof datos === 'object', 'fulfillSheet recibe datos');
		assert(typeof datos.indicadores === 'object', 'fulfillSheet recibe indicadores');
		getCell(worksheet, 'A1').v = datos.carta.denominacion + datos.carta.expediente;
		getCell(worksheet, 'A2').v = 'Expediente: ' + datos.carta.expediente;
		getCell(worksheet, 'A3').v = 'Enlace: ' + datos.carta.url;
		getCell(worksheet, 'A5').v = datos.jerarquia.nombrelargo;
		for (var i = 0, j = datos.jerarquias.length, fila = 6; i < j; i++, fila++){
			getCell(worksheet, 'A' + fila).v = datos.jerarquias[i].nombrelargo;
		}
		getCell(worksheet, 'A8').v = 'http://10.166.47.22/carta/' + datos.carta.idjerarquia;
		getCell(worksheet, 'A8').l = 'http://10.166.47.22/carta/' + datos.carta.idjerarquia;

		for (i = 0, j = datos.objetivos.length, fila = 13; i < j; i++){
			fila = fulfillObjetivo(worksheet, datos.objetivos[i], fila, datos.anualidad, datos.indicadores);
		}
		worksheet['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: 20, r: fila}});
	}

	ExportadorCartas.prototype.toFile = function(filename, entidadobjetoid, anualidad){
		var defer = Q.defer();
		var instance = this;
		Q.all([ this.loadEntidadObjeto(entidadobjetoid), this.loadObjetivos(entidadobjetoid) ])
			.then(function(information){
				Q.all( [ instance.loadJerarquias(information[0].idjerarquia), instance.loadIndicadores(information[0].idjerarquia) ])
					.then(function(information2){
						var workbook = XLSX.readFile(instance.templatefile),
							datos = {
								anualidad: anualidad,
								carta: information[0],
								objetivos: information[1],
								jerarquia: information2[0].jerarquia,
								jerarquias: information2[0].jerarquias,
								indicadores: information2[1]
							};
						fulfillSheet(workbook.Sheets[ workbook.SheetNames[0] ], datos);
						defer.resolve(workbook);
						XLSX.writeFile(workbook, filename);
					},
					function(err){
						defer.reject({error: 'Cannot load metadata', details: err});
					});
			},
			function(err){
				defer.reject({error: 'Cannot load metadata', details: err});
			});
		return defer.promise;
	};


	module.exports = ExportadorCartas;
})(module, console, assert);