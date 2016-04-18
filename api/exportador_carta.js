(function(module, logger){
	'use strict';

	var assert = require('assert');
	var Excel = require('exceljs'),
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
		this.models.procedimientomodel = this.models.procedimiento();
		this.templatefile = templatefile;
	}

	function getCell(worksheet, path /*, type*/){
		return worksheet.getCell(path);
		/*
		if (typeof worksheet[path] !== 'object'){
			worksheet[path] = {};
			if (typeof type === 'undefined'){
				worksheet[path] = { v: '', t: 's'};
			}else {
				worksheet[path] = { v: '', t: type};
			}
		}
		return worksheet[path];*/
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
			for (var i = 0, j = o.length; i < j; i++){
				by_Id[ o[i]._id ] = o[i];
			}
			defer.resolve(by_Id);
		}, function(err){
			defer.reject(err);
		});
		return defer.promise;
	};

	ExportadorCartas.prototype.loadProcedimientos = function(ids){
		var restriccion = { '_id': {$in: ids} };
		var defer = Q.defer();
		this.models.procedimientomodel.find(restriccion).then(function(o){
			var by_Id = {};
			for (var i = 0, j = o.length; i < j; i++){
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
		worksheet.getRow(fila).font = { bold: true };
		worksheet.getRow(fila).alignment = { horizontal: 'center' };
		getCell(worksheet, 'C' + fila).value = 'E';
		getCell(worksheet, 'D' + fila).value = 'F';
		getCell(worksheet, 'E' + fila).value = 'M';
		getCell(worksheet, 'F' + fila).value = 'A';
		getCell(worksheet, 'G' + fila).value = 'M';
		getCell(worksheet, 'H' + fila).value = 'J';
		getCell(worksheet, 'I' + fila).value = 'J';
		getCell(worksheet, 'J' + fila).value = 'A';
		getCell(worksheet, 'K' + fila).value = 'S';
		getCell(worksheet, 'L' + fila).value = 'O';
		getCell(worksheet, 'M' + fila).value = 'N';
		getCell(worksheet, 'N' + fila).value = 'D';
		getCell(worksheet, 'O' + fila).value = anualidad;
	}

	function bgColorResultado (resultado, formula){
		var result = '';
		if (!resultado || resultado === 0 || resultado === ''){
			return '';
		}
		for (var i = 0, j = formula.intervalos.length; i < j; i++){
			if (resultado >= formula.intervalos[i].min && resultado <= formula.intervalos[i].max){
				return 'FF' + formula.intervalos[i].color.replace('#', '');
			}
		}
		return result;
	}

	function valueRow(worksheet, fila, anualidad, indicador){
		var datos = indicador.valores['a' + anualidad],
			thin = { style: 'thin' },
			bordered = {
				top: thin,
				left: thin,
				bottom: thin,
				right: thin
			},
			row = worksheet.getRow(fila);
		datos[0] ? getCell(worksheet, 'C' + fila, 'n').value = datos[0] : '';
		datos[1] ? getCell(worksheet, 'D' + fila, 'n').value = datos[1] : '';
		datos[2] ? getCell(worksheet, 'E' + fila, 'n').value = datos[2] : '';
		datos[3] ? getCell(worksheet, 'F' + fila, 'n').value = datos[3] : '';
		datos[4] ? getCell(worksheet, 'G' + fila, 'n').value = datos[4] : '';
		datos[5] ? getCell(worksheet, 'H' + fila, 'n').value = datos[5] : '';
		datos[6] ? getCell(worksheet, 'I' + fila, 'n').value = datos[6] : '';
		datos[7] ? getCell(worksheet, 'J' + fila, 'n').value = datos[7] : '';
		datos[8] ? getCell(worksheet, 'K' + fila, 'n').value = datos[8] : '';
		datos[9] ? getCell(worksheet, 'L' + fila, 'n').value = datos[9] : '';
		datos[10] ? getCell(worksheet, 'M' + fila, 'n').value = datos[10] : '';
		datos[11] ? getCell(worksheet, 'N' + fila, 'n').value = datos[11] : '';
		datos[12] ? getCell(worksheet, 'O' + fila, 'n').value = datos[12] : '';

		for (var i = 3; i < 16; i++){
			row.getCell(i).border = bordered;
		}
	}

	function array_sum(arr){
		return arr.reduce(function(a, b){ return a + b; });
	}

	function valueRowProcedimiento(worksheet, fila, anualidad, procedimiento, campo){
		var datos = procedimiento.periodos['a' + anualidad] ? procedimiento.periodos['a' + anualidad][campo] : [],
			thin = { style: 'thin' },
			bordered = {
				top: thin,
				left: thin,
				bottom: thin,
				right: thin
			},
			row = worksheet.getRow(fila);
		datos[0] ? getCell(worksheet, 'C' + fila, 'n').value = datos[0] : '';
		datos[1] ? getCell(worksheet, 'D' + fila, 'n').value = datos[1] : '';
		datos[2] ? getCell(worksheet, 'E' + fila, 'n').value = datos[2] : '';
		datos[3] ? getCell(worksheet, 'F' + fila, 'n').value = datos[3] : '';
		datos[4] ? getCell(worksheet, 'G' + fila, 'n').value = datos[4] : '';
		datos[5] ? getCell(worksheet, 'H' + fila, 'n').value = datos[5] : '';
		datos[6] ? getCell(worksheet, 'I' + fila, 'n').value = datos[6] : '';
		datos[7] ? getCell(worksheet, 'J' + fila, 'n').value = datos[7] : '';
		datos[8] ? getCell(worksheet, 'K' + fila, 'n').value = datos[8] : '';
		datos[9] ? getCell(worksheet, 'L' + fila, 'n').value = datos[9] : '';
		datos[10] ? getCell(worksheet, 'M' + fila, 'n').value = datos[10] : '';
		datos[11] ? getCell(worksheet, 'N' + fila, 'n').value = datos[11] : '';
		getCell(worksheet, 'O' + fila, 'n').value = array_sum(datos);

		for (var i = 3; i < 16; i++){
			row.getCell(i).border = bordered;
		}
	}

	function valueRowFormula(worksheet, fila, anualidad, formula){
		var datos = formula.valores['a' + anualidad];
		var i, j = 13;
		var row = worksheet.getRow(fila), celda, bg;
		for (i = 0, j = 13; i < j; i++){
			if (datos[i] && datos[i].resultado){
				celda = row.getCell(3 + i);
				celda.value = datos[0].resultado;
				bg = bgColorResultado(datos[i].resultado, formula);
				if (bg !== ''){
					celda.fill = {type: 'pattern', pattern: 'darkVertical', fgColor:{argb: bg}};
				}
			}
		}
	}

	function fulfillFormula(worksheet, formula, fila, anualidad, indicadores, procedimientos){
		var indicador, procedimiento,
			i = 0, j = 0,
			bordered = {
				top: {style: 'thin'},
				left: {style: 'thin'},
				bottom: {style: 'thin'},
				right: {style: 'thin'}
			};
		worksheet.mergeCells('B' + fila + ':' + 'O' + fila);
		getCell(worksheet, 'B' + fila).alignment = { wrapText: true };
		getCell(worksheet, 'B' + fila).value = formula.human;
		getCell(worksheet, 'B' + fila).font = {bold: true};
		fila++;fila++;
		monthRow(worksheet, fila, anualidad);
		fila++;
		for (i = 0, j = formula.indicadores.length; i < j; i++, fila++){
			if (typeof indicadores[ formula.indicadores[i] ] === 'object'){
				indicador = indicadores[ formula.indicadores[i] ];
				getCell(worksheet, 'B' + fila).value = indicador.nombre;
				getCell(worksheet, 'B' + fila).alignment = { wrapText: true };
				valueRow(worksheet, fila, anualidad, indicador);
			} else {
				logger.error('No se ha cargado:', formula.indicadores[i], indicadores);
			}
		}
		if (typeof formula.procedimientos === 'object'){
			for (i = 0, j = formula.procedimientos.length; i < j; i++, fila++){
				if (typeof procedimientos[ formula.procedimientos[i].procedimiento ] === 'object'){
					procedimiento = procedimientos[ formula.procedimientos[i].procedimiento ];

					getCell(worksheet, 'B' + fila).value = procedimiento.denominacion + ' [' + formula.procedimientos[i].campo + ']';
					getCell(worksheet, 'B' + fila).alignment = { wrapText: true };
					valueRowProcedimiento(worksheet, fila, anualidad, procedimiento, formula.procedimientos[i].campo);
				} else {
					logger.error('No se ha cargado:', formula.procedimientos[i].procedimiento, procedimientos);
				}
			}
		}
		fila++;
		fila++;
		getCell(worksheet, 'B' + fila).value = 'META PARCIAL'; fila++;
		getCell(worksheet, 'B' + fila).value = 'SUMA PARCIAL /CÁLCULO';
		valueRowFormula(worksheet, fila, anualidad, formula);
		fila++;
		getCell(worksheet, 'B' + fila).value = 'VALOR EVALUACION'; fila++;

		return fila + 1;
	}

	function fulfillObjetivo(worksheet, objetivo, fila, anualidad, indicadores, procedimientos){
		getCell(worksheet, 'A' + fila).value = objetivo.index;
		getCell(worksheet, 'A' + fila).font = {bold: true};
		getCell(worksheet, 'A' + fila).alignment = {horizontal: 'center'};
		worksheet.mergeCells('B' + fila + ':' + 'O' + fila);
		getCell(worksheet, 'B' + fila).value = objetivo.denominacion;
		getCell(worksheet, 'B' + fila).alignment = { wrapText: true };
		fila += 2;
		for (var i = 0, j = objetivo.formulas.length; i < j; i++){
			fila = fulfillFormula(worksheet, objetivo.formulas[i], fila, anualidad, indicadores, procedimientos);
		}
		return fila;
	}

	function fulfillSheet(worksheet, datos){
		var i = 0, j = 0, fila = 0;
		assert(typeof worksheet === 'object', 'fulfillSheet recibe worksheet');
		assert(typeof datos === 'object', 'fulfillSheet recibe datos');
		assert(typeof datos.indicadores === 'object', 'fulfillSheet recibe indicadores');

		worksheet.getColumn('B').width = 30;
		getCell(worksheet, 'A' + fila).value = datos.carta.denominacion + ' ' + datos.carta.expediente; fila++;
		getCell(worksheet, 'A' + fila).value = 'Expediente: ' + datos.carta.expediente;
		fila++;
		getCell(worksheet, 'A' + fila).value = {
			text: 'Enlace: ' + datos.carta.url,
			hyperlink: datos.carta.url
		};
		fila++;
		getCell(worksheet, 'A' + fila).value = 'Entidad:'; fila++;

		for (i = 0, j = datos.jerarquias.length; i < j; i++, fila++){
			getCell(worksheet, 'A' + fila).value = datos.jerarquias[j - i - 1].nombrelargo;
		}
		getCell(worksheet, 'A' + fila).value = datos.jerarquia.nombrelargo; fila++;
		getCell(worksheet, 'A' + fila).value = {
			text: 'http://10.166.47.22/carta/' + datos.carta.idjerarquia,
			hyperlink: 'http://10.166.47.22/carta/' + datos.carta.idjerarquia
		};
		fila++; fila++; fila++;
		worksheet.getRow(fila).font = {bold: true};
		getCell(worksheet, 'A' + fila).value = 'Código'; getCell(worksheet, 'B' + fila).value = 'Denominación';
		getCell(worksheet, 'A' + fila).alignment = {horizontal: 'center'};
		fila++;

		for (i = 0, j = datos.objetivos.length, fila++; i < j; i++){
			fila = fulfillObjetivo(worksheet, datos.objetivos[i], fila, datos.anualidad, datos.indicadores, datos.procedimientos);
		}
	}



	ExportadorCartas.prototype.toFile = function(filename, entidadobjetoid, anualidad, creator){
		var defer = Q.defer();
		var instance = this;
		Q.all([ this.loadEntidadObjeto(entidadobjetoid), this.loadObjetivos(entidadobjetoid) ])
			.then(function(information){
				var i, j, k, l, q, w;
				var objetivos = information[1],
					ids_procedimientos = [];
				for (i = 0, j = objetivos.length; i < j; i++){
					for (k = 0, l = objetivos[i].formulas.length; k < l; k++){
						if (typeof objetivos[i].formulas[k].procedimientos === 'object'){
							for ( q = 0, w = objetivos[i].formulas[k].procedimientos.length; q < w; q++){
								ids_procedimientos.push( objetivos[i].formulas[k].procedimientos[q].procedimiento );
							}
						}
					}
				}

				Q.all( [ instance.loadJerarquias(information[0].idjerarquia), instance.loadIndicadores(information[0].idjerarquia), instance.loadProcedimientos(ids_procedimientos) ])
					.then(function(information2){
						var workbook = new Excel.Workbook(),
							datos = {
								anualidad: anualidad,
								carta: information[0],
								objetivos: information[1],
								jerarquia: information2[0].jerarquia,
								jerarquias: information2[0].jerarquias,
								indicadores: information2[1],
								procedimientos: information2[2]
							};

						if (typeof creator === 'undefined'){
							creator = 'Me';
						}

						workbook.creator = creator;
						workbook.lastModifiedBy = creator;
						workbook.created = new Date();
						workbook.modified = new Date();

						workbook.addWorksheet(datos.carta.expediente);
						var worksheet = workbook.getWorksheet(datos.carta.expediente);
						fulfillSheet(worksheet, datos);
						workbook.xlsx.writeFile(filename)
						.then(function() {
							logger.log('fichero almacenado');
							defer.resolve(workbook);
						});
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

	ExportadorCartas.prototype.toExpress = function(app, md5, cfg){
		var instance = this;
		return function(req, res){
			var creator = req.user.login;
			var time = new Date().getTime();
			var path = app.get('prefixtmp'),
				filename = path + time + '.xlsx';
			var entidadobjetoid = req.params.id,
				anualidad = parseInt(req.params.anualidad);

			var hash = md5(cfg.downloadhashprefix + time);
			instance.toFile(filename, entidadobjetoid, anualidad, creator)
				.then(function(){
					res.json({'time': time, 'hash': hash, extension: '.xlsx'});
				}, function(error){
					res.status(500).json({error: error});
				});
		};
	};

	module.exports = ExportadorCartas;

})(module, console);
