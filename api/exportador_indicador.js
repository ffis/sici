(function(module, logger){
	'use strict';

	var assert = require('assert');
	var Excel = require('exceljs'),
		Q = require('q');

	function ExportadorIndicador(models, templatefile){
		this.models = models;
		this.models.entidadobjetomodel = this.models.entidadobjeto();
		this.models.objetivomodel = this.models.objetivo();
		this.models.jerarquiamodel = this.models.jerarquia();
		this.models.indicadormodel = this.models.indicador();
		this.models.procedimientomodel = this.models.procedimiento();
		this.templatefile = templatefile;
	}

	ExportadorIndicador.prototype.loadIndicadores = function(){
		var defer = Q.defer();
		this.models.indicadormodel.find().sort({'idjerarquia': 1}).exec().then(function(indicadores){
			logger.log(indicadores.length);
			var objs = {};
			for (var i = 0, j = indicadores.length; i < j; i++){
				if (typeof objs['' + indicadores[i].idjerarquia] === 'undefined'){
					objs['' + indicadores[i].idjerarquia] = {};
				}
				objs['' + indicadores[i].idjerarquia ]['' + indicadores[i]._id] = indicadores[i];
			}
			defer.resolve(objs);
		}, defer.reject);
		return defer.promise;
	};
	ExportadorIndicador.prototype.loadEntidadObjeto = function(){
		var defer = Q.defer();
		this.models.entidadobjetomodel.find().sort({'idjerarquia': 1}).then(defer.resolve, defer.reject);
		return defer.promise;
	};
	ExportadorIndicador.prototype.loadJerarquias = function(){
		var defer = Q.defer();
		this.models.jerarquiamodel.find().then(function(jerarquias){
			var objs = {};
			for (var i = 0, j = jerarquias.length; i < j; i++){
				objs['' + parseInt(jerarquias[i].id) ] = jerarquias[i];
			}
			defer.resolve(objs);
		}, defer.reject);
		return defer.promise;
	};
	ExportadorIndicador.prototype.loadObjetivos = function(){
		var defer = Q.defer();
		this.models.objetivomodel.find().sort({'index': 1}).then(function(objetivos){
			var objs = {};
			for (var i = 0, j = objetivos.length; i < j; i++){
				if (typeof objs['' + objetivos[i].carta] === 'undefined'){
					objs['' + objetivos[i].carta] = [];
				}
				objs['' + objetivos[i].carta ].push(objetivos[i]);
			}
			defer.resolve(objs);
		}, defer.reject);
		return defer.promise;
	};

	function getCell(worksheet, path, type){
		var t;
		if (typeof type !== 'undefined'){
			if (Array.isArray(path)){
				t = worksheet.getCell(path[1], path[0]);
			} else {
				t = worksheet.getCell(path);
			}
			if (type === 'n'){
			//	t.type = Excel.ValueType.Number;
			} else if (type === 'f'){
				t.type = Excel.ValueType.Formula;
			}

			return t;
		}
		if (Array.isArray(path)){
			return worksheet.getCell(path[1], path[0]);
		}
		return worksheet.getCell(path);
	}

	function getRowsInfoCarta (carta, objetivos, indicadores, jerarquia){
		if (!objetivos || !indicadores){
			return [];
		}
		var rows = [], row;
		for (var i = 0, j = objetivos.length; i < j; i++){
			for (var q = 0, w = objetivos[i].formulas.length; q < w; q++){
				for (var e = 0, r = objetivos[i].formulas[q].indicadores.length; e < r; e++){
					var indicador = indicadores[ objetivos[i].formulas[q].indicadores[e] ];
					if (indicador){
						row = {
							entidad: jerarquia,
							carta: carta,
							objetivo: objetivos[i],
							numero_indicador: e,
							indicador: indicador
						};
						rows.push(row);
					} else {
						logger.log('posible corrupción en: ', carta.idjerarquia, i, q, e, objetivos[i].formulas[q].indicadores[e] );
					}
				}
			}
		}
		return rows;
	}

	function monthRow(worksheet, fila, columnainicial, anualidad){
		var	thin = { style: 'thin' },
			bordered = {
				top: thin,
				left: thin,
				bottom: thin,
				right: thin
			}, celda;
		var columnas = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

		//getCell(worksheet, 'O' + fila).value = anualidad;
		for (var i = 0, j = columnas.length; i < j; i++){
			celda = getCell(worksheet, [i + columnainicial, fila]);
			celda.value = columnas[i];
			celda.border = bordered;
		}
		celda = getCell(worksheet, [columnas.length + columnainicial, fila]);
		celda.value = anualidad;
		celda.border = bordered;
		return columnainicial + columnas.length + 1;
	}

	function headers(worksheet, fila){
		var	thin = { style: 'thin' },
			bordered = {
				top: thin,
				left: thin,
				bottom: thin,
				right: thin
			},
			celda,
			filaobj = worksheet.getRow(fila),
			columnas = [
				'Entidad', 'Nombre entidad', 'Denominación carta', 'Número de compromiso', 'Compromiso', 'Número de fórmula',
				'Indicador', 'Acumulador'
			];

		filaobj.font = { bold: true };
		filaobj.alignment = { horizontal: 'center' };
		for (var i = 0, j = columnas.length; i < j; i++){
			celda = filaobj.getCell(i + 1);
			celda.value = columnas[i];
			celda.border = bordered;
		}
		var columna = columnas.length + 1;
		//ahora las anualidades
		//desde 2015
		var f = new Date();
		for (i = 2015, j = parseInt( f.getFullYear() ) + 1; i < j; i++){
			columna = monthRow(worksheet, fila, columna, i);
		}

		var celdasGrandes = [2, 4, 6];
		for (i = 0, j = celdasGrandes.length; i < j; i++){
	//		fila.getCell(celdasGrandes[i]).width = 30;
		}
	}

	function addIndicador(worksheet, indicador, fila, columna){
		var	thin = { style: 'thin' },
			bordered = {
				top: thin,
				left: thin,
				bottom: thin,
				right: thin
			};
		if (typeof indicador !== 'object'){
			return;
		}
		var f = new Date(), i, j, q, w, values;
		for (i = 2015, j = parseInt( f.getFullYear() ) + 1; i < j; i++){
			values = indicador.valores ? (indicador.valores[ 'a' + i ] ? indicador.valores[ 'a' + i ] : []) : [];
			w = values.length > 0 ? values.length : 13;
			for (q = 0; q < w; q++){
				var celda = getCell(worksheet, [columna, fila], 'n');
				columna++;
				if (q < values.length && typeof values[q] === 'number'){
					celda.value = values[q];
				} else {
					celda.value = '';
				}
				celda.border = bordered;
			}
		}
	}

	function addRow(worksheet, row, fila){

		assert(typeof row.carta === 'object', 'addRow recibe carta');
		assert(typeof row.objetivo === 'object', 'addRow recibe objetivo');
		assert(typeof row.numero_indicador === 'number', 'addRow recibe numero_indicador');
		assert(typeof row.indicador === 'object', 'addRow recibe indicador');

		getCell(worksheet, [1, fila]).value = row.carta.idjerarquia;
		getCell(worksheet, [2, fila]).value = row.entidad ? row.entidad.nombrelargo : '';
		getCell(worksheet, [2, fila]).alignment = { wrapText: true };
		getCell(worksheet, [3, fila]).value = row.carta.denominacion;
		getCell(worksheet, [4, fila]).value = row.objetivo.index;
		getCell(worksheet, [5, fila]).value = row.objetivo.denominacion;
		getCell(worksheet, [6, fila]).value = row.numero_indicador;
		getCell(worksheet, [7, fila]).value = row.indicador.nombre;
		getCell(worksheet, [8, fila]).value = row.indicador.acumulador;

		addIndicador(worksheet, row.indicador, fila, 9);
	}

	function addRows(worksheet, rows, fila){
		for (var i = 0, j = rows.length; i < j; i++){
			addRow(worksheet, rows[i], fila + i);
		}
		return fila + rows.length;
	}

	function fulfillSheet(worksheet, datos){

		assert(typeof worksheet === 'object', 'fulfillSheet recibe worksheet');
		assert(typeof datos === 'object', 'fulfillSheet recibe datos');
		assert(typeof datos.cartas === 'object', 'fulfillSheet recibe cartas');

		var fila = 1, rows;
		headers(worksheet, fila);
		worksheet.getColumn('B').width = 30;
		worksheet.getColumn('C').width = 30;
		worksheet.getColumn('E').width = 30;
		worksheet.getColumn('G').width = 30;
		fila++;
		for (var i = 0, j = datos.cartas.length; i < j; i++){
			rows = getRowsInfoCarta(
				datos.cartas[i],
				datos.objetivos[ '' + datos.cartas[i]._id ],
				datos.indicadores[ '' + datos.cartas[i].idjerarquia],
				datos.jerarquias[ '' + parseInt(datos.cartas[i].idjerarquia) ]);
			fila = addRows(worksheet, rows, fila);
		}
	}

	ExportadorIndicador.prototype.toFile = function(filename, creator){
		var defer = Q.defer();
		var instance = this;

		Q.all([ this.loadEntidadObjeto(), this.loadObjetivos(), this.loadIndicadores(), this.loadJerarquias() ])
			.then(function(information){

				var workbook = new Excel.Workbook(),
					datos = {
						cartas: information[0],
						objetivos: information[1],
						indicadores: information[2],
						jerarquias: information[3]
					};

				if (typeof creator === 'undefined'){
					creator = 'Me';
				}
				workbook.creator = creator;
				workbook.lastModifiedBy = creator;
				workbook.created = new Date();
				workbook.modified = new Date();

				workbook.addWorksheet('Indicadores');
				var worksheet = workbook.getWorksheet('Indicadores');

				fulfillSheet(worksheet, datos);

				workbook
					.xlsx
					.writeFile(filename)
					.then(function() {
						logger.log('fichero almacenado');
						defer.resolve(workbook);
					}, defer.reject);
			},
			function(err){
				defer.reject({error: 'Cannot load metadata', details: err});
			});
		return defer.promise;
	};

	ExportadorIndicador.prototype.toExpress = function(app, md5, cfg){
		var instance = this;
		return function(req, res){
			var creator = req.user.login;
			var time = new Date().getTime();
			var path = app.get('prefixtmp'),
				filename = path + time + '.xlsx';

			var hash = md5(cfg.downloadhashprefix + time);
			instance.toFile(filename, creator)
				.then(function(){
					res.json({'time': time, 'hash': hash, extension: '.xlsx'});
				}, function(error){
					res.status(500).json({error: error});
				});
		};
	};

	module.exports = ExportadorIndicador;

})(module, console);
