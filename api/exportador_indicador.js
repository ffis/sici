(function(module, logger){
	'use strict';

	const assert = require('assert'),
		Excel = require('exceljs'),
		Q = require('q'),
		md5 = require('md5');

	const INICIALESMESES = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
		COLUMNAS = ['Entidad', 'Nombre entidad', 'Denominación carta', 'Número de compromiso', 'Compromiso', 'Número de fórmula', 'Indicador', 'Acumulador'];
	const THIN = {style: 'thin'},
		BORDERED = {top: THIN, left: THIN, bottom: THIN, right: THIN};

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
		const defer = Q.defer();
		this.models.indicadormodel.find().sort({'idjerarquia': 1}).exec().then(function(indicadores){
			const objs = {};
			for (let i = 0, j = indicadores.length; i < j; i += 1){
				if (typeof objs[String(indicadores[i].idjerarquia)] === 'undefined'){
					objs[String(indicadores[i].idjerarquia)] = {};
				}
				objs[String(indicadores[i].idjerarquia)][String(indicadores[i]._id)] = indicadores[i];
			}
			defer.resolve(objs);
		}, defer.reject);

		return defer.promise;
	};

	ExportadorIndicador.prototype.loadEntidadObjeto = function(){

		return this.models.entidadobjetomodel.find().sort({'idjerarquia': 1});
	};

	ExportadorIndicador.prototype.loadJerarquias = function(){
		const defer = Q.defer();
		this.models.jerarquiamodel.find().lean().then(function(jerarquias){

			const objs = jerarquias.reduce(function(prev, jerarquia){
				prev[String(jerarquia.id)] = jerarquia;

				return prev;
			}, {});

			defer.resolve(objs);
		}, defer.reject);

		return defer.promise;
	};
	ExportadorIndicador.prototype.loadObjetivos = function(){
		const defer = Q.defer();
		this.models.objetivomodel.find().lean().sort({'index': 1}).then(function(objetivos){
			const objs = {};
			for (let i = 0, j = objetivos.length; i < j; i += 1){
				if (typeof objs[String(objetivos[i].carta)] === 'undefined'){
					objs[String(objetivos[i].carta)] = [];
				}
				objs[String(objetivos[i].carta)].push(objetivos[i]);
			}
			defer.resolve(objs);
		}, defer.reject);

		return defer.promise;
	};

	function getCell(worksheet, path, type){
		let t = false;
		if (typeof type !== 'undefined'){
			if (Array.isArray(path)){
				t = worksheet.getCell(path[1], path[0]);
			} else {
				t = worksheet.getCell(path);
			}
			//if (type === 'n'){
			//	t.type = Excel.ValueType.Number;
			//} else
			if (type === 'f'){
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
		const rows = [];
		for (let i = 0, j = objetivos.length; i < j; i += 1){
			for (let q = 0, w = objetivos[i].formulas.length; q < w; q += 1){
				for (let e = 0, r = objetivos[i].formulas[q].indicadores.length; e < r; e += 1){
					const indicador = indicadores[String(objetivos[i].formulas[q].indicadores[e])];
					if (indicador){
						rows.push({
							entidad: jerarquia,
							carta: carta,
							objetivo: objetivos[i],
							numero_indicador: e,
							indicador: indicador
						});
					}
				}
			}
		}

		return rows;
	}

	function monthRow(worksheet, fila, columnainicial, anualidad){
		//getCell(worksheet, 'O' + fila).value = anualidad;
		for (let i = 0, j = INICIALESMESES.length; i < j; i++){
			const celda = getCell(worksheet, [i + columnainicial, fila]);
			celda.value = INICIALESMESES[i];
			celda.border = BORDERED;
		}
		const celda = getCell(worksheet, [INICIALESMESES.length + columnainicial, fila]);
		celda.value = anualidad;
		celda.border = BORDERED;

		return columnainicial + INICIALESMESES.length + 1;
	}

	function headers(worksheet, fila){
		const filaobj = worksheet.getRow(fila);

		filaobj.font = {bold: true};
		filaobj.alignment = {horizontal: 'center'};
		for (let i = 0, j = COLUMNAS.length; i < j; i += 1){
			const celda = filaobj.getCell(i + 1);
			celda.value = COLUMNAS[i];
			celda.border = BORDERED;
		}
		let columna = COLUMNAS.length + 1;
		//ahora las anualidades
		//desde 2015
		const f = new Date();
		for (let i = 2015, j = f.getFullYear() + 1; i < j; i += 1){
			columna = monthRow(worksheet, fila, columna, i);
		}

	//	var celdasGrandes = [2, 4, 6];
	//	for (i = 0, j = celdasGrandes.length; i < j; i++){
	//		fila.getCell(celdasGrandes[i]).width = 30;
	//	}
	}

	function addIndicador(worksheet, indicador, fila, columnainicial){
		if (typeof indicador !== 'object'){
			
			return;
		}

		const f = new Date();

		for (let i = 2015, j = f.getFullYear() + 1; i < j; i += 1){
			const values = indicador.valores ? (indicador.valores['a' + i] ? indicador.valores['a' + i] : []) : [];
			const w = values.length > 0 ? values.length : 13;
			for (let q = 0, columna = columnainicial; q < w; q += 1, columna += 1){
				const celda = getCell(worksheet, [columna, fila + q], 'n');
				if (q < values.length && typeof values[q] === 'number'){
					celda.value = values[q];
				} else {
					celda.value = '';
				}
				celda.border = BORDERED;
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
		getCell(worksheet, [2, fila]).alignment = {wrapText: true};
		getCell(worksheet, [3, fila]).value = row.carta.denominacion;
		getCell(worksheet, [4, fila]).value = row.objetivo.index;
		getCell(worksheet, [5, fila]).value = row.objetivo.denominacion;
		getCell(worksheet, [6, fila]).value = row.numero_indicador;
		getCell(worksheet, [7, fila]).value = row.indicador.nombre;
		getCell(worksheet, [8, fila]).value = row.indicador.acumulador;

		addIndicador(worksheet, row.indicador, fila, 9);
	}

	function addRows(worksheet, rows, fila){
		for (let i = 0, j = rows.length; i < j; i += 1){
			addRow(worksheet, rows[i], fila + i);
		}

		return fila + rows.length;
	}

	function fulfillSheet(worksheet, datos){

		assert(typeof worksheet === 'object', 'fulfillSheet recibe worksheet');
		assert(typeof datos === 'object', 'fulfillSheet recibe datos');
		assert(typeof datos.cartas === 'object', 'fulfillSheet recibe cartas');

		let fila = 1;
		headers(worksheet, fila);
		worksheet.getColumn('B').width = 30;
		worksheet.getColumn('C').width = 30;
		worksheet.getColumn('E').width = 30;
		worksheet.getColumn('G').width = 30;
		fila += 1;
		for (let i = 0, j = datos.cartas.length; i < j; i += 1){
			const rows = getRowsInfoCarta(
				datos.cartas[i],
				datos.objetivos[String(datos.cartas[i]._id)],
				datos.indicadores[String(datos.cartas[i].idjerarquia)],
				datos.jerarquias[String(datos.cartas[i].idjerarquia)]);
			fila = addRows(worksheet, rows, fila);
		}
	}

	ExportadorIndicador.prototype.toFile = function(filename, creator){
		const defer = Q.defer();
		const instance = this;
		const cargas = [instance.loadEntidadObjeto(), instance.loadObjetivos(), instance.loadIndicadores(), instance.loadJerarquias()];
		Q.all(cargas).then(function(information){
			const workbook = new Excel.Workbook(),
				datos = {
					cartas: information[0],
					objetivos: information[1],
					indicadores: information[2],
					jerarquias: information[3]
				};

			workbook.creator = (typeof creator === 'undefined') ? 'Me' : creator;
			workbook.lastModifiedBy = (typeof creator === 'undefined') ? 'Me' : creator;
			workbook.created = new Date();
			workbook.modified = new Date();

			workbook.addWorksheet('Indicadores');
			const worksheet = workbook.getWorksheet('Indicadores');

			fulfillSheet(worksheet, datos);

			workbook.xlsx.writeFile(filename).then(function(){ defer.resolve(workbook); }, defer.reject);
		}, defer.reject);

		return defer.promise;
	};

	ExportadorIndicador.prototype.toExpress = function(app, cfg){
		const instance = this;

		return function(req, res){
			const creator = req.user.login;
			const time = new Date().getTime();
			const path = app.get('prefixtmp'),
				filename = path + time + '.xlsx';

			const hash = md5(cfg.downloadhashprefix + time);
			instance.toFile(filename, creator).then(function(){
				res.json({'time': time, 'hash': hash, extension: '.xlsx'});
			}, req.eh.errorHelper(res));
		};
	};

	module.exports = ExportadorIndicador;

})(module, console);
