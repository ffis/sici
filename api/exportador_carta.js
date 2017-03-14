(function(module, logger){
	'use strict';

	const assert = require('assert'),
		Excel = require('exceljs'),
		Q = require('q'),
		md5 = require('md5');

	const WRAPTEXT = {wrapText: true},
		BOLD = {bold: true},
		HORIZONTALCENTER = {horizontal: 'center'},
		THIN = {style: 'thin'},
		BORDERED = {top: THIN, left: THIN, bottom: THIN, right: THIN};

	function ExportadorCartas(models, templatefile){
		this.models = models;
		this.models.entidadobjetomodel = this.models.entidadobjeto();
		this.models.objetivomodel = this.models.objetivo();
		this.models.jerarquiamodel = this.models.jerarquia();
		this.models.indicadormodel = this.models.indicador();
		this.models.procedimientomodel = this.models.procedimiento();
		this.templatefile = templatefile;
	}

	function Formulable(formula){
		this.formula = formula;
	}
	Formulable.prototype.traduce = function(){ return {formula: '', result: ''}; };

	function FormulaPorcentaje(formula){ this.formula = formula; }
	FormulaPorcentaje.prototype = Formulable;
	FormulaPorcentaje.prototype.traduce = function(worksheet, columna, fila, valor){
		
		return valor;
		/*
		var celda = worksheet.getRow(fila).getCell(columna);
		var letra = worksheet.getRow(fila).getCell(columna)._column.letter;
		return { formula: '(' + letra + (fila - 5) + '/' + letra + (fila - 4) + ') * 100', result: valor };
		*/
	};

	function formulaEsTraducible(formula){
		if (formula && typeof formula.computer === 'string' && formula.computer !== ''){
			try {
				const pf = JSON.parse(formula.computer);
				if (pf.length === 7 && pf[0].trim() === '(' && pf[2].trim() === '/' && pf[4].trim() === ')' && pf[5].trim() === '*' && pf[6].trim() === '100'){
					//logger.log('he encontrado formula', pf);
					return new FormulaPorcentaje(formula);
				}
			} catch (exception){
				logger.log('no es formula', formula.human, formula.computer, exception);
				
				return false;
			}
		}
		logger.log('no es formula', formula.human, formula.computer);
		
		return false;
	}

	function getCell(worksheet, path, type){
		var t;
		if (typeof type !== 'undefined'){
			t = worksheet.getCell(path);
			if (type === 'n'){
				t.type = Excel.ValueType.Number;
			} else if (type === 'f'){
				t = worksheet.getCell(path);
				t.type = Excel.ValueType.Formula;
			}
		
			return t;
		}
		
		return worksheet.getCell(path);
	}

	ExportadorCartas.prototype.loadEntidadObjeto = function(entidadobjetoid) {
		
		return this.models.entidadobjetomodel.findOne({_id: entidadobjetoid}).lean().exec();
	};

	ExportadorCartas.prototype.loadObjetivos = function(cartaid){

		return this.models.objetivomodel.find({'carta': cartaid}).sort({'index': 1}).lean().exec();
	};

	ExportadorCartas.prototype.loadIndicadores = function(jerarquiaid){

		const defer = Q.defer();
		this.models.indicadormodel.find({'idjerarquia': parseInt(jerarquiaid, 10)}).then(function(indicadores){
			defer.resolve(indicadores.reduce(function(prev, indicador){
				prev[String(indicador._id)] = indicador;

				return prev;
			}, {}));
		}, defer.reject);

		return defer.promise;
	};

	ExportadorCartas.prototype.loadProcedimientos = function(ids){
		
		const defer = Q.defer();
		this.models.procedimientomodel.find({'_id': {$in: ids}}).then(function(o){
			defer.resolve(o.reduce(function(prev, procedimiento){
				prev[String(procedimiento._id)] = procedimiento;

				return prev;
			}, {}));
		}, defer.reject);

		return defer.promise;
	};

	ExportadorCartas.prototype.loadJerarquias = function(jerarquiaid){
		const defer = Q.defer(),
			instance = this;
		instance.models.jerarquiamodel.findOne({'id': parseInt(jerarquiaid, 10)}).lean().exec().then(function(o){
			if (o){
				if (typeof o.ancestros === 'object' && o.ancestros.length > 0){
					instance.models.jerarquiamodel.find({'id': {'$in': o.ancestros}}).select('nombrelargo id').lean().exec().then(function(ancestros){
						const elems = [];
						for (let i = 0, j = o.ancestros.length; i < j; i += 1){
							for (var k = 0, l = ancestros.length; k < l; k += 1){
								if (o.ancestros[i] === ancestros[k].id){
									elems.push(ancestros[k]);
									break;
								}
							}
						}
						defer.resolve({jerarquia: o, jerarquias: elems});
					}, defer.reject);
				} else {
					defer.resolve({jerarquia: o, jerarquias: []});
				}
			} else {
				defer.resolve({jerarquia: o, jerarquias: []});
			}
		}, defer.reject);

		return defer.promise;
	};

	function monthRow(worksheet, fila, anualidad){
		worksheet.getRow(fila).font = BOLD;
		worksheet.getRow(fila).alignment = HORIZONTALCENTER;
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

		if (!resultado || resultado === 0 || resultado === ''){
			return '';
		}
		for (let i = 0, j = formula.intervalos.length; i < j; i += 1){
			if (resultado >= formula.intervalos[i].min && resultado <= formula.intervalos[i].max){
				
				return 'FF' + formula.intervalos[i].color.replace('#', '');
			}
		}
		return '';
	}

	function valueRow(worksheet, fila, anualidad, indicador){
		var datos = indicador.valores['a' + anualidad],
			row = worksheet.getRow(fila);
		for (let i = 0; i < 13; i += 1){
			const cell = row.getCell(3 + i, 'n');
			if (datos[i]){
				cell.value = datos[i];
			}
			row.getCell(3 + i).border = BORDERED;
		}
	}

	function array_sum(arr){
		return arr.reduce(function(a, b){ return a + b; });
	}

	function valueRowProcedimiento(worksheet, fila, anualidad, procedimiento, campo){
		var datos = procedimiento.periodos['a' + anualidad] ? procedimiento.periodos['a' + anualidad][campo] : [],
			row = worksheet.getRow(fila);
		const COLUMNS = ['C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'L', 'M', 'N'];
		COLUMNS.forEach(function(letter, index){
			if (datos[index]){
				getCell(worksheet, letter + fila, 'n').value = datos[index];
			}
		});
		getCell(worksheet, 'O' + fila, 'n').value = array_sum(datos);

		for (var i = 3; i < 16; i++){
			row.getCell(i).border = BORDERED;
		}
	}

	function valueRowFormula(worksheet, fila, anualidad, formula){
		const datos = formula.valores['a' + anualidad];
		const j = 13;
		const row = worksheet.getRow(fila);
		const f = formulaEsTraducible(formula);
		for (let i = 0; i < j; i += 1){
			if (datos[i] && datos[i].resultado){
				const celda = row.getCell(3 + i);
				if (f){
					celda.value = f.traduce(worksheet, 3 + i, fila, datos[i].resultado);
				} else {
					celda.value = datos[i].resultado;
				}
				const bg = bgColorResultado(datos[i].resultado, formula);
				if (bg !== ''){
					celda.fill = {type: 'pattern', pattern: 'darkVertical', fgColor:{argb: bg}};
				}
			}
		}
	}


	function fulfillFormula(worksheet, formula, filainicial, anualidad, indicadores, procedimientos){
		let fila = filainicial;

		worksheet.mergeCells('B' + fila + ':' + 'O' + fila);
		getCell(worksheet, 'B' + fila).alignment = WRAPTEXT;
		getCell(worksheet, 'B' + fila).value = formula.human;
		getCell(worksheet, 'B' + fila).font = BOLD;
		fila += 2;
		monthRow(worksheet, fila, anualidad);
		fila += 1;
		for (let i = 0, j = formula.indicadores.length; i < j; i += 1, fila += 1){
			if (typeof indicadores[String(formula.indicadores[i])] === 'object'){
				const indicador = indicadores[String(formula.indicadores[i])];
				getCell(worksheet, 'B' + fila).value = indicador.nombre;
				getCell(worksheet, 'B' + fila).alignment = WRAPTEXT;
				valueRow(worksheet, fila, anualidad, indicador);
			} else {
				logger.error('No se ha cargado:', formula.indicadores[i], indicadores);
			}
		}
		if (typeof formula.procedimientos === 'object'){
			for (let i = 0, j = formula.procedimientos.length; i < j; i++, fila += 1){
				if (typeof procedimientos[String(formula.procedimientos[i].procedimiento)] === 'object'){
					const procedimiento = procedimientos[formula.procedimientos[i].procedimiento];

					getCell(worksheet, 'B' + fila).value = procedimiento.denominacion + ' [' + formula.procedimientos[i].campo + ']';
					getCell(worksheet, 'B' + fila).alignment = WRAPTEXT;
					valueRowProcedimiento(worksheet, fila, anualidad, procedimiento, formula.procedimientos[i].campo);
				} else {
					logger.error('No se ha cargado:', formula.procedimientos[i].procedimiento, procedimientos);
				}
			}
		}
		fila += 1;
		fila += 1;
		getCell(worksheet, 'B' + fila).value = 'META PARCIAL';
		fila += 1;
		getCell(worksheet, 'B' + fila).value = 'SUMA PARCIAL /CÁLCULO';
		valueRowFormula(worksheet, fila, anualidad, formula);
		fila += 1;
		getCell(worksheet, 'B' + fila).value = 'VALOR EVALUACION';
		fila += 1;

		return fila + 1;
	}

	function fulfillObjetivo(worksheet, objetivo, filainicial, anualidad, indicadores, procedimientos){
		let fila = filainicial;

		getCell(worksheet, 'A' + fila).value = objetivo.index;
		getCell(worksheet, 'A' + fila).font = BOLD;
		getCell(worksheet, 'A' + fila).alignment = HORIZONTALCENTER;
		worksheet.mergeCells('B' + fila + ':' + 'O' + fila);
		getCell(worksheet, 'B' + fila).value = objetivo.denominacion;
		getCell(worksheet, 'B' + fila).alignment = WRAPTEXT;
		fila += 2;
		for (let i = 0, j = objetivo.formulas.length; i < j; i += 1){
			fila = fulfillFormula(worksheet, objetivo.formulas[i], fila, anualidad, indicadores, procedimientos);
		}

		return fila;
	}

	function fulfillSheet(worksheet, datos){
		let fila = 0;
		assert(typeof worksheet === 'object', 'fulfillSheet recibe worksheet');
		assert(typeof datos === 'object', 'fulfillSheet recibe datos');
		assert(typeof datos.indicadores === 'object', 'fulfillSheet recibe indicadores');

		worksheet.getColumn('B').width = 30;
		getCell(worksheet, 'A' + fila).value = datos.carta.denominacion + ' ' + datos.carta.expediente; fila++;
		getCell(worksheet, 'A' + fila).value = 'Expediente: ' + datos.carta.expediente;
		
		fila += 1;
		
		getCell(worksheet, 'A' + fila).value = {text: 'Enlace: ' + datos.carta.url, hyperlink: datos.carta.url};

		fila += 1;

		getCell(worksheet, 'A' + fila).value = 'Entidad:';
		fila += 1;

		for (let i = 0, j = datos.jerarquias.length; i < j; i += 1, fila += 1){
			getCell(worksheet, 'A' + fila).value = datos.jerarquias[j - i - 1].nombrelargo;
		}
		getCell(worksheet, 'A' + fila).value = datos.jerarquia.nombrelargo;
		fila += 1;
		getCell(worksheet, 'A' + fila).value = {
			text: 'http://10.166.47.22/carta/' + datos.carta.idjerarquia,
			hyperlink: 'http://10.166.47.22/carta/' + datos.carta.idjerarquia
		};
		fila += 3;

		worksheet.getRow(fila).font = BOLD;
		getCell(worksheet, 'A' + fila).value = 'Código'; getCell(worksheet, 'B' + fila).value = 'Denominación';
		getCell(worksheet, 'A' + fila).alignment = HORIZONTALCENTER;
		fila += 2;

		for (let i = 0, j = datos.objetivos.length; i < j; i += 1, fila += 1){
			fila = fulfillObjetivo(worksheet, datos.objetivos[i], fila, datos.anualidad, datos.indicadores, datos.procedimientos);
		}
	}

	ExportadorCartas.prototype.toFile = function(filename, entidadobjetoid, anualidad, creator){
		const defer = Q.defer();
		const instance = this;
		Q.all([this.loadEntidadObjeto(entidadobjetoid), this.loadObjetivos(entidadobjetoid)]).then(function(information){
			const objetivos = information[1],
				idsprocedimientos = [];
			for (let i = 0, j = objetivos.length; i < j; i += 1){
				for (let k = 0, l = objetivos[i].formulas.length; k < l; k += 1){
					if (typeof objetivos[i].formulas[k].procedimientos === 'object'){
						for (let q = 0, w = objetivos[i].formulas[k].procedimientos.length; q < w; q += 1){
							idsprocedimientos.push(objetivos[i].formulas[k].procedimientos[q].procedimiento);
						}
					}
				}
			}

			const tasks = [
				instance.loadJerarquias(information[0].idjerarquia),
				instance.loadIndicadores(information[0].idjerarquia),
				instance.loadProcedimientos(idsprocedimientos)
			];

			Q.all(tasks).then(function(information2){
				const workbook = new Excel.Workbook(),
					datos = {
						anualidad: anualidad,
						carta: information[0],
						objetivos: information[1],
						jerarquia: information2[0].jerarquia,
						jerarquias: information2[0].jerarquias,
						indicadores: information2[1],
						procedimientos: information2[2]
					};

				workbook.creator = (typeof creator === 'undefined') ? 'Me' : creator;
				workbook.lastModifiedBy = (typeof creator === 'undefined') ? 'Me' : creator;
				workbook.created = new Date();
				workbook.modified = new Date();

				workbook.addWorksheet(datos.carta.expediente);
				const worksheet = workbook.getWorksheet(datos.carta.expediente);
				fulfillSheet(worksheet, datos);
				workbook.xlsx.writeFile(filename).then(function() {
					logger.log('fichero almacenado');
					defer.resolve(workbook);
				}, defer.reject);
			}, defer.reject);
		}, defer.reject);

		return defer.promise;
	};

	ExportadorCartas.prototype.toExpress = function(app, cfg){
		var instance = this;

		return function(req, res){
			const creator = req.user.login;
			const time = new Date().getTime();
			const path = app.get('prefixtmp'),
				filename = path + time + '.xlsx',
				entidadobjetoid = req.params.id,
				anualidad = parseInt(req.params.anualidad, 10);

			const hash = md5(cfg.downloadhashprefix + time);
			instance.toFile(filename, entidadobjetoid, anualidad, creator).then(function(){
				res.json({'time': time, 'hash': hash, extension: '.xlsx'});
			}, req.eh.errorHelper(res));
		};
	};

	module.exports = ExportadorCartas;

})(module, console);
