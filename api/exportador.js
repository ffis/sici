(function(module, logger){
	'use strict';

	const Q = require('q'),
		fs = require('fs'),
		md5 = require('md5'),
		path = require('path'),
		XLSX = require('xlsx');

	const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

	const INDICADORES = ['Solicitados', 'Iniciados', 'Quejas presentadas en el mes', 'Recursos presentados en el mes', 'Resueltos < 1', 'Resueltos 1 < 5',
		'Resueltos 5 < 10', 'Resueltos 10 < 15', 'Resueltos 15 < 30', 'Resueltos 30 < 45', 'Resueltos > 45',
		'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', 'Resueltos por Prescripción/Caducidad (Resp. Admón.)',
		'En plazo',
		'Resueltos totales', 'Fuera de plazo', 'Pendientes'];
	const INDICADORESDATABASE = ['solicitados', 'iniciados', 'quejas', 'recursos', 'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30',
		'resueltos_45', 'resueltos_mas_45', 'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion', 'en_plazo',
		'total_resueltos', 'fuera_plazo', 'pendientes'];

	function Workbook() {
		if (!(this instanceof Workbook)){
			const r = new Workbook();
			r.SheetNames = [];
			r.Sheets = [];

			return r;
		}
		this.SheetNames = [];
		this.Sheets = {};
	}

	/* start of code executed on mongodb */
	function fnMap(){
		var mes = 0,
			i2 = 0,
			j2 = 0;

		for (var a in this.periodos){
			var anualidad = parseInt(a.replace('a', ''), 10);
			if (anualidad > 0){
				var val = this.periodos[a];
				
				val.procedimientos = [this.codigo];
				val.numProcedimientos = val.procedimientos.length;
				val.numProcedimientosConSolicitudes = 0;

				var t_medio_naturales_new = [];
				var t_medio_habiles_new = [];
				for (mes = 0; mes < 12; mes += 1){
					var tmn = {
						count: typeof val.t_medio_naturales === 'object' && typeof val.t_medio_naturales[mes] === 'number' && parseInt(val.t_medio_naturales[mes], 10) > 0 ? 1 : 0,
						value: typeof val.t_medio_naturales === 'object' && typeof val.t_medio_naturales[mes] === 'number' && parseInt(val.t_medio_naturales[mes], 10) > 0 ? parseInt(val.t_medio_naturales[mes], 10) : 0
					};
					var tmh = {
						count: (typeof val.t_medio_habiles === 'object' && typeof val.t_medio_habiles[mes] === 'number' && parseInt(val.t_medio_habiles[mes], 10) > 0) ? 1 : 0,
						value: (typeof val.t_medio_habiles === 'object' && typeof val.t_medio_habiles[mes] === 'number' && parseInt(val.t_medio_habiles[mes], 10) > 0) ? parseInt(val.t_medio_habiles[mes], 10) : 0
					};
					t_medio_naturales_new.push(tmn);
					t_medio_habiles_new.push(tmh);
				}

				val.t_medio_naturales = t_medio_naturales_new;
				val.t_medio_habiles = t_medio_habiles_new;

				if (val.totalsolicitudes > 0) {
					val.numProcedimientosConSolicitudes += 1;
				}
				
				for (i2 = 0, j2 = this.ancestros.length; i2 < j2; i2 += 1){
					emit({'anualidad': anualidad, 'idjerarquia': this.ancestros[i2].id}, val);
				}
			}
		}
	}

	function fnReduce(key, values){
		var i = 0,
			j = 0,
			k = 0,
			l = 0;
		var mes = 0;
		var sumas = {};
		var attrs = [
			'total_resueltos', 'solicitados',
			'iniciados',
			'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15',
			'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
			'resueltos_desistimiento_renuncia_caducidad',
			'resueltos_prescripcion',
			'en_plazo', 'quejas', 'recursos',
			'fuera_plazo', 'pendientes'
		];

		attrs.forEach(function (attr) {
			sumas[attr] = [];
			for (var m = 0; m < 12; m += 1) {
				sumas[attr][m] = 0;
				for (var it = 0; it < values.length; it += 1) {
					if (values[it][attr]) {
						sumas[attr][m] += parseInt(values[it][attr][m], 10);
					}
				}
			}
		});
		sumas.procedimientos = [];
		sumas.t_medio_naturales = [];
		sumas.t_medio_habiles = [];
		for (mes = 0; mes < 12; mes += 1){
			sumas.t_medio_naturales.push({count: 0, value: 0});
			sumas.t_medio_habiles.push({count: 0, value: 0});
		}

		for (i = 0, j = values.length; i < j; i += 1){
			for (k = 0, l = values[i].procedimientos.length; k < l; k += 1){
				sumas.procedimientos.push(values[i].procedimientos[k]);
			}
			for (mes = 0; mes < 12; mes += 1){
				sumas.t_medio_naturales[mes].count += values[i].t_medio_naturales[mes].count;
				sumas.t_medio_naturales[mes].value += values[i].t_medio_naturales[mes].value;
				sumas.t_medio_habiles[mes].count += values[i].t_medio_habiles[mes].count;
				sumas.t_medio_habiles[mes].value += values[i].t_medio_habiles[mes].value;
			}
		}
		sumas.numProcedimientos = sumas.procedimientos.length;
		sumas.numProcedimientosConSolicitudes = values.reduce(function(prev, elem){ return prev + elem.numProcedimientosConSolicitudes; }, 0);

		return sumas;
	}

	function fnFinalize(key, val){
		val.t_medio_naturales_anual = {count: 0, value: 0, avg: 0};
		val.t_medio_habiles_anual = {count: 0, value: 0, avg: 0};
		val.debug = JSON.parse(JSON.stringify(val.t_medio_naturales));
		for (var mes = 0; mes < 12; mes += 1){
			val.t_medio_naturales_anual.count += val.t_medio_naturales[mes].count;
			val.t_medio_naturales_anual.value += val.t_medio_naturales[mes].value;
			val.t_medio_habiles_anual.count += val.t_medio_habiles[mes].count;
			val.t_medio_habiles_anual.value += val.t_medio_habiles[mes].value;


			val.t_medio_naturales[mes] = (val.t_medio_naturales[mes].count === 0 ) ? 0 : parseFloat((val.t_medio_naturales[mes].value / val.t_medio_naturales[mes].count).toFixed(2));
			val.t_medio_habiles[mes] = (val.t_medio_habiles[mes].count === 0 ) ? 0 : parseFloat((val.t_medio_habiles[mes].value / val.t_medio_habiles[mes].count).toFixed(2));
		}
		val.t_medio_naturales_anual.avg = (val.t_medio_naturales_anual.count === 0 ) ? 0 : parseFloat((val.t_medio_naturales_anual.value / val.t_medio_naturales_anual.count).toFixed(2));
		val.t_medio_habiles_anual.avg = (val.t_medio_habiles_anual.count === 0 ) ? 0 : parseFloat((val.t_medio_habiles_anual.value / val.t_medio_habiles_anual.count).toFixed(2));

		return val;
	}
	/* end code executed on mongodb */

	function mapReducePeriodos(models, idjerarquia, permisoscalculados){
		const procedimientomodel = models.procedimiento();
		const restriccion = {oculto: {'$ne': true}, eliminado: {'$ne': true}};
		if (idjerarquia){
			restriccion['ancestros.id'] = idjerarquia;
		}

		if (permisoscalculados && typeof permisoscalculados === 'object' && !permisoscalculados.superuser){
			if (typeof permisoscalculados.procedimientoslectura === 'undefined'){
				permisoscalculados.procedimientoslectura = [];
			}
			if (typeof permisoscalculados.procedimientosdirectalectura === 'undefined'){
				permisoscalculados.procedimientosdirectalectura = [];
			}
			if (typeof permisoscalculados.procedimientosdirectaescritura === 'undefined'){
				permisoscalculados.procedimientosdirectaescritura = [];
			}
			if (typeof permisoscalculados.procedimientosescritura === 'undefined'){
				permisoscalculados.procedimientosescritura = [];
			}
			restriccion.codigo = {'$in': permisoscalculados.procedimientosdirectalectura.concat(permisoscalculados.procedimientoslectura, permisoscalculados.procedimientosdirectaescritura, permisoscalculados.procedimientosescritura)};
		}

		return procedimientomodel.mapReduce({query: restriccion, map: fnMap, reduce: fnReduce, finalize: fnFinalize});
	}

	function completarTabla(periodo, ws){
		for (let mes = 0; mes < 12; mes += 1) {
			ws[XLSX.utils.encode_cell({'c': 4 + mes, 'r': 16})] = {'v': MESES[mes], 't': 's'};
		}
		for (let i = 0; i < INDICADORESDATABASE.length; i += 1) {
			ws[XLSX.utils.encode_cell({'c': 3, 'r': 17 + i})] = {'v': INDICADORES[i], 't': 's'};
			for (let mes = 0; mes < 12; mes += 1) {
				ws[XLSX.utils.encode_cell({'c': 4 + mes, 'r': 17 + i})] = {'v': periodo[INDICADORESDATABASE[i]] ? periodo[INDICADORESDATABASE[i]][mes] : 0, 't': 'n'};
			}
		}

		return ws;
	}

	function tablaResultadosJerarquiaDesglosado(models, jerarquia, permisoscalculados) {
		
		const jerarquiamodel = models.jerarquia(),
			defer = Q.defer(),
			loadDescendientes = jerarquiamodel.find({ancestrodirecto: jerarquia.id}, {id: true, _id: false, nombre: true, numProcedimientos: true, nombrelargo: true}).exec();

		Q.all([loadDescendientes, mapReducePeriodos(models, null, permisoscalculados)]).then(function(allData) {
			const hijos = allData[0],
				results = allData[1];
			hijos.unshift({nombrelargo: jerarquia.nombrelargo, nombre: jerarquia.nombre, id: jerarquia.id});

			const idshijos = hijos.map(function(hijo){ return hijo.id; });
			const periodos = {};
			results.forEach(function(result){
				if (idshijos.indexOf(result._id.idjerarquia) >= 0) {
					var idjerarquia = result._id.idjerarquia;
					if (typeof periodos[idjerarquia] === 'undefined'){
						periodos[idjerarquia] = {};
					}
					periodos[idjerarquia][parseInt(result._id.anualidad, 10)] = result.value;
				}
			});

			const rowhead = 4;
			let ir = rowhead + 1;
			var columnhead = 4;
			const ws = {};
			let ic = columnhead + 1;
			let maxRow = ir;
			let maxColumn = ic;
			let k = 0;
			for (let i = 0, j = hijos.length; i < j; i += 1){
				const h = hijos[i];
				if (typeof periodos[idshijos[i]] === 'object'){
					ws[XLSX.utils.encode_cell({'c': ic + k, 'r': rowhead})] = {'v': h.nombrelargo, 't': 's'};
					k += 1;
				}
			}

			maxColumn = ic + k;
			ic = columnhead;
			if (typeof periodos[jerarquia.id] === 'undefined'){
				periodos[jerarquia.id] = {};
			}

			for (let anualidad = 2014; typeof periodos[jerarquia.id][anualidad] !== 'undefined'; anualidad += 1){
				ws[XLSX.utils.encode_cell({'c': ic, 'r': ir})] = {'v': anualidad, 't': 'n'};
				ir += 1;
				for (let ind = 0, l2 = INDICADORES.length; ind < l2; ind += 1){
					ws[XLSX.utils.encode_cell({'c': ic, 'r': ir})] = {'v': INDICADORES[ind], 't': 's'};
					ir += 1;
				}
			}
			maxRow = ir;

			// RESTO DE LINEAS
			ic = columnhead + 1;
			ir = rowhead + 1;

			// PARA CADA HIJO UNA COLUMNA
			for (let i = 0, l = idshijos.length; i < l; i += 1){
				ir = rowhead + 1;
				if (periodos[idshijos[i]] === 'object'){
					for (let anualidad = 2014; typeof periodos[idshijos[i]][anualidad] !== 'undefined'; anualidad += 1){
						ir += 1;
						for (let ind = 0, l2 = INDICADORESDATABASE.length; ind < l2; ind += 1){
							const valor = periodos[idshijos[i]][anualidad][INDICADORESDATABASE[ind]];
							const ivalor = valor[0] + valor[1] + valor[2] + valor[3] + valor[4] + valor[5] + valor[6] + valor[7] + valor[8] + valor[9] + valor[10] + valor[11];

							ws[XLSX.utils.encode_cell({'c': ic, 'r': ir})] = {'v': ivalor, 't': 'n'};
							ir += 1;
						}
					}
					ic += 1;
				}
			}

			ws['!ref'] = XLSX.utils.encode_range({'s': {'c': 0, 'r': 0}, 'e': {'c': maxColumn, 'r': maxRow}});
			defer.resolve(ws);
		}, defer.reject);

		return defer.promise;
	}

	module.exports.tablaResultadosJerarquia = function (req, res){
		const models = req.metaenvironment.models,
			cfg = req.metaenvironment.cfg;

		if ((typeof req.params.jerarquia === 'undefined') || (req.params.jerarquia === null)){
			req.eh.missingParameterHelper(res, 'jerarquia');

			return;
		}
		const jerarquiamodel = models.jerarquia();
		const idj = parseInt(req.params.jerarquia, 10);
		if (idj > 0){
			jerarquiamodel.findOne({'id': idj}).lean().exec().then(function(jerarquia){
				const deferSheets = [Q.defer(), Q.defer()];
				const wb = new Workbook();
				mapReducePeriodos(models, idj, req.user.permisoscalculados).then(function(mrp){
					const d = new Date();
					const datosRelacionados = mrp.filter(function(results){
						return (results._id.idjerarquia === idj);
					});
					for (let anualidad = 2013; anualidad <= d.getFullYear(); anualidad += 1){
						const ws = {};
						const wsName = String(anualidad);
						wb.SheetNames.push(wsName);

						ws[XLSX.utils.encode_cell({'c': 4, 'r': 5})] = {'v': jerarquia.nombrelargo, 't': 's'};
						ws['!ref'] = XLSX.utils.encode_range({'s': {'c': 0, 'r': 0}, 'e': {'c': 20, 'r': 40}});
						/* TODO: revisar ese rango */
						const datosPeriodo = datosRelacionados.filter(function(results){ return results._id.anualidad === anualidad; });
						if (datosPeriodo.length > 0){
							completarTabla(datosPeriodo[0].value, ws);
						}

						wb.Sheets[wsName] = ws;
					}
					deferSheets[0].resolve();
				}, deferSheets[0].reject);

				tablaResultadosJerarquiaDesglosado(models, jerarquia, req.user.permisoscalculados).then(function(ws2){
					const wsName = 'resumen descendientes';
					wb.SheetNames.push(wsName);
					wb.Sheets[wsName] = ws2;
					deferSheets[1].resolve();
				}, deferSheets[1].reject);

				Q.all([deferSheets[0].promise, deferSheets[1].promise]).then(function(){
					const time = new Date().getTime();
					XLSX.writeFile(wb, cfg.prefixtmp + time + '.xlsx');
					logger.log({'time': time, 'hash': md5(cfg.downloadhashprefix + time)});
					res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time)});
				}, req.eh.errorHelper(res));
			}, req.eh.errorHelper(res));
		} else {
			req.eh.notFoundHelper(res);
		}
	};

	function rellenarProcedimientos(procedimientos, year, models, personasByCodPlaza) {
		const deferProc = Q.defer();
		const indicadoresDatabase = ['solicitados', 'iniciados', 'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30',
			'resueltos_45', 'resueltos_mas_45', 'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion', 't_medio_naturales', 't_medio_habiles',
			'en_plazo', 'quejas', 'recursos'];
		const indicadores = ['Solicitados', 'Iniciados', 'Resueltos < 1', 'Resueltos 1 < 5', 'Resueltos 5 < 10', 'Resueltos 10 < 15', 'Resueltos 15 < 30',
			'Resueltos 30 < 45', 'Resueltos > 45', 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', 'Resueltos por Prescripción/Caducidad (Resp. Admón.)',
			'Tiempo medio en días naturales', 'Tiempo medio en días hábiles descontando Tiempo de suspensiones', 'En plazo', 'Quejas presentadas en el mes',
			'Recursos presentados en el mes'];
		const precabeceras = ['Código', 'Denominación del procedimiento', 'Código Nivel 1', 'Denominación Nivel 1', 'Código Nivel 2', 'Denominación Nivel 2', 'Código Nivel 3', 'Denominación Nivel 3',
			'Código plaza responsable', 'Login responsable', 'Nombre responsable', 'Correo-e responsable', 'Teléfono responsable',
			'Plazo máximo legal para resolver (dias naturales)', 'Plazo máximo legal para resolver (dias hábiles)', 'Plazo CS /ANS (días naturales)',
			'Plazo CS /ANS (días hábiles)', 'Pendientes iniciales (a 31-12)'];

		const lastyear = parseInt(year.substring(1, 5), 10) - 1,
			lastyearstr = 'a' + lastyear,
			ws = {};
		let columna = 1;
			//coordenadasmerges = [];

		for (let i = 0; i < precabeceras.length; i += 1){
			ws[XLSX.utils.encode_cell({'c': columna++, 'r': 1})] = {'v': precabeceras[i], 't': 's'};
		}

		ws[XLSX.utils.encode_cell({'c': columna + 6, 'r': 0})] = {'v': 'RESUELTOS EN LOS MESES DE ' + lastyear, 't': 's'};

		for (let i = 0; i < MESES.length; i += 1) {
			ws[XLSX.utils.encode_cell({'c': columna++, 'r': 1})] = {'v': MESES[i], 't': 's'};
		}

		for (let i = 0; i < MESES.length; i += 1) {
			ws[XLSX.utils.encode_cell({'c': columna + 6, 'r': 0})] = {'v': MESES[i], 't': 's'};
			for (let j = 0; j < indicadores.length; j += 1) {
				ws[XLSX.utils.encode_cell({'c': columna++, 'r': 1})] = {'v': indicadores[j], 't': 's'};
			}
		}

		const dim = columna;
		for (let i = 0; i < procedimientos.length; i += 1){
			columna = 1;
			const procedimiento = procedimientos[i];

			ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': procedimiento.codigo, 't': 's'};
			ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': procedimiento.denominacion, 't': 's'};

			if ((typeof procedimiento.ancestros !== 'undefined') && (procedimiento.ancestros.length > 1)) {
				if (procedimiento.ancestros.length === 4) {
					for (let j = 0; j < 3; j += 1){
						ws[XLSX.utils.encode_cell({'c': columna, 'r': i + 2})] = {'v': procedimiento.ancestros[j].id, 't': 'n'};
						ws[XLSX.utils.encode_cell({'c': columna + 1, 'r': i + 2})] = {'v': procedimiento.ancestros[j].nombrelargo, 't': 's'};

						columna += 2;
					}
				} else if (procedimiento.ancestros.length === 3){

					ws[XLSX.utils.encode_cell({'c': columna, 'r': i + 2})] = {'v': procedimiento.ancestros[0].id, 't': 'n'};
					ws[XLSX.utils.encode_cell({'c': columna + 1, 'r': i + 2})] = {'v': procedimiento.ancestros[0].nombrelargo, 't': 's'};
					ws[XLSX.utils.encode_cell({'c': columna + 4, 'r': i + 2})] = {'v': procedimiento.ancestros[1].id, 't': 'n'};
					ws[XLSX.utils.encode_cell({'c': columna + 5, 'r': i + 2})] = {'v': procedimiento.ancestros[1].nombrelargo, 't': 's'};

					columna += 6;
				} else if (procedimiento.ancestros.length === 2){

					ws[XLSX.utils.encode_cell({'c': columna + 4, 'r': i + 2})] = {'v': procedimiento.ancestros[0].id, 't': 'n'};
					ws[XLSX.utils.encode_cell({'c': columna + 5, 'r': i + 2})] = {'v': procedimiento.ancestros[0].nombrelargo, 't': 's'};
					columna += 6;
				}
			} else {
				columna += 6;
			}

			ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': procedimiento.cod_plaza, 't': 's'};

			var persona = procedimiento.cod_plaza !== null && procedimiento.cod_plaza !== '' ? personasByCodPlaza[procedimiento.cod_plaza] : false;
			if (persona) {
				ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': persona.login, 't': 's'};
				ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': persona.apellidos + ', ' + persona.nombre, 't': 's'};
				ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': persona.login + '@carm.es', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': persona.telefono, 't': 's'};
			} else {
				ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': 'Persona no encontrada', 't': 's'};
				columna += 3;
			}

			ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': ((typeof procedimiento.periodos[year].plazo_maximo_resolver === 'undefined' || procedimiento.periodos[year].plazo_maximo_resolver === null) ? '' : procedimiento.periodos[year].plazo_maximo_resolver), 't': 'n'};
			ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': ((typeof procedimiento.periodos[year].plazo_maximo_responder === 'undefined' || procedimiento.periodos[year].plazo_maximo_responder === null) ? '' : procedimiento.periodos[year].plazo_maximo_responder), 't': 'n'};
			ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': ((typeof procedimiento.periodos[year].plazo_CS_ANS_naturales === 'undefined' || procedimiento.periodos[year].plazo_CS_ANS_naturales === null) ? '' : procedimiento.periodos[year].plazo_CS_ANS_naturales), 't': 'n'};
			ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': ((typeof procedimiento.periodos[year].plazo_CS_ANS_habiles === 'undefined' || procedimiento.periodos[year].plazo_CS_ANS_habiles === null) ? '' : procedimiento.periodos[year].plazo_CS_ANS_habiles), 't': 'n'};
			ws[XLSX.utils.encode_cell({'c': columna++, 'r': i + 2})] = {'v': ((typeof procedimiento.periodos[year].pendientes_iniciales === 'undefined' || procedimiento.periodos[year].pendientes_iniciales === null) ? '' : procedimiento.periodos[year].pendientes_iniciales), 't': 'n'};
			for (let mes = 0; mes < MESES.length; mes += 1) {
				if (typeof procedimiento.periodos[lastyearstr] !== 'undefined' && typeof procedimiento.periodos[lastyearstr].total_resueltos !== 'undefined') {
					ws[XLSX.utils.encode_cell({'c': columna, 'r': i + 2})] = {'v': ((typeof procedimiento.periodos[lastyearstr].total_resueltos[mes] === 'undefined') ? '' : procedimiento.periodos[lastyearstr].total_resueltos[mes]), 't': 'n'};
				}
				columna += 1;
			}
			for (let mes = 0; mes < MESES.length; mes += 1) {
				for (let ind = 0; ind < indicadoresDatabase.length; ind += 1) {
					if (typeof procedimiento.periodos[year][indicadoresDatabase[ind]] === 'number') {
						ws[XLSX.utils.encode_cell({'c': columna, 'r': i + 2})] = {'v': ((typeof procedimiento.periodos[year][indicadoresDatabase[ind]][mes] === 'undefined') ? '' : procedimiento.periodos[year][indicadoresDatabase[ind]][mes]), 't': 'n'};
					}
					columna += 1;
				}
			}
		}

		ws['!ref'] = XLSX.utils.encode_range({s: {'c': 0, 'r': 0}, e: {'c': dim + 1, 'r': procedimientos.length + 1}});
		deferProc.resolve(ws);

		return deferProc.promise;
	}

	module.exports.tablaResultadosProcedimiento = function (req, res) {
		if (typeof req.params.codigo !== 'string' || req.params.codigo.trim() === ''){
			req.eh.missingParameterHelper(res, 'codigo');

			return;
		}
		if (typeof req.params.year !== 'string' || req.params.year.trim() === ''){
			req.eh.missingParameterHelper(res, 'year');

			return;
		}

		const models = req.metaenvironment.models,
			cfg = req.metaenvironment.cfg,
			procedimientomodel = models.procedimiento(),
			datosBasicosNombre = ['Código', 'Denominación', 'Tipo', 'Código de plaza'],
			datosBasicos = ['codigo', 'denominacion', 'tipo', 'cod_plaza'],
			datosFechasNombre = ['Fecha de creación', 'Fecha de versión'],
			datosFechas = ['fecha_creacion', 'fecha_version'],
			datosBasicosAnualidadNombre = ['Pendientes iniciales (a 31-12)', 'Plazo CS/ANS (días hábiles)', 'Plazo CS/ANS (días naturales)', 'Plazo máximo legal para resolver (días naturales)', 'Plazo máximo legal para resolver (días hábiles)'],
			datosBasicosAnualidad = ['pendientes_iniciales', 'plazo_CS_ANS_habiles', 'plazo_CS_ANS_naturales', 'plazo_maximo_resolver', 'plazo_maximo_responder'];

		procedimientomodel.findOne({'codigo': req.params.codigo.trim()}).lean().exec().then(function (proc) {
			if (!proc) {
				req.eh.notFoundHelper(res);
				
				return;
			}
			const wb = new Workbook();
			const ws = {};
			let fila = 1;
			for (let i = 0; i < datosBasicos.length; i += 1) {
				const value = proc[datosBasicos[i]];

				ws[XLSX.utils.encode_cell({'c': 4, 'r': fila})] = {'v': (value === null || typeof value === 'undefined') ? '' : value, 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 3, 'r': fila})] = {'v': datosBasicosNombre[i], 't': 's'};
				fila += 1;
			}
			for (let i = 0; i < datosFechas.length; i += 1) {
				const value = proc[datosFechas[i]];

				ws[XLSX.utils.encode_cell({'c': 4, 'r': fila})] = {'v': (value === null || typeof value === 'undefined') ? '' : value, 't': 'd'};
				ws[XLSX.utils.encode_cell({'c': 3, 'r': fila})] = {'v': datosFechasNombre[i], 't': 's'};
				fila += 1;
			}
			for (let i = 0; i < datosBasicosAnualidad.length; i += 1) {
				const value = proc.periodos[req.params.year][datosBasicosAnualidad[i]];

				ws[XLSX.utils.encode_cell({'c': 4, 'r': fila})] = {'v': (value === null || typeof value === 'undefined') ? '' : value, 't': 'n'};
				ws[XLSX.utils.encode_cell({'c': 3, 'r': fila})] = {'v': datosBasicosAnualidadNombre[i], 't': 's'};
				fila += 1;
			}
			const padreDefer = Q.defer();
			if (typeof proc.padre === 'string' && proc.padre.trim() !== '') {
				procedimientomodel.findOne({'codigo': proc.padre.trim()}, {'codigo': true, 'denominacion': true}, padreDefer.makeNodeResolver());
			} else {
				padreDefer.resolve();
			}
			completarTabla(proc.periodos[req.params.year], ws);
			padreDefer.promise.then(function(padre){
				if (padre){
					ws[XLSX.utils.encode_cell({'c': 4, 'r': fila})] = {'v': '[' + padre.codigo + '] ' + padre.denominacion, 't': 's'};
					ws[XLSX.utils.encode_cell({'c': 3, 'r': fila})] = {'v': 'Padre', 't': 's'};
					padreDefer.resolve();
				}

				ws['!ref'] = XLSX.utils.encode_range({'s': {'c': 0, 'r': 0}, 'e': {'c': 20, 'r': 40}});
				wb.SheetNames.push('Procedimiento');
				wb.Sheets.Procedimiento = ws;
				const time = new Date().getTime();
				XLSX.writeFile(wb, cfg.prefixtmp + time + '.xlsx');
				res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time)});
			}, req.eh.errorHelper(res));
		}, req.eh.errorHelper(res));
	};

	function hojaUsuarios(personas){
		const defer = Q.defer(),
			ws = {};

		ws[XLSX.utils.encode_cell({'c': 0, 'r': 0})] = {'v': 'Nombre', 't': 's'};
		ws[XLSX.utils.encode_cell({'c': 1, 'r': 0})] = {'v': 'Apellidos', 't': 's'};
		ws[XLSX.utils.encode_cell({'c': 2, 'r': 0})] = {'v': 'Login', 't': 's'};
		ws[XLSX.utils.encode_cell({'c': 3, 'r': 0})] = {'v': 'Código plaza', 't': 's'};
		ws[XLSX.utils.encode_cell({'c': 4, 'r': 0})] = {'v': 'Habilitado', 't': 's'};

		for (let i = 1, j = personas.length; i <= j; i += 1) {
			const persona = personas[i - 1];
			ws[XLSX.utils.encode_cell({'c': 0, 'r': i})] = {'v': persona.nombre, 't': 's'};
			ws[XLSX.utils.encode_cell({'c': 1, 'r': i})] = {'v': persona.apellidos, 't': 's'};
			ws[XLSX.utils.encode_cell({'c': 2, 'r': i})] = {'v': persona.login, 't': 's'};
			ws[XLSX.utils.encode_cell({'c': 3, 'r': i})] = {'v': persona.codplaza, 't': 's'};
			ws[XLSX.utils.encode_cell({'c': 4, 'r': i})] = {'v': persona.habilitado ? 1 : 0, 't': 'n'};
		}

		ws['!ref'] = XLSX.utils.encode_range({s: {'c': 0, 'r': 0}, e: {'c': 5, 'r': personas.length + 1}} );
		defer.resolve({'wsName': 'Usuarios', 'sheet': ws});

		return defer.promise;
	}
	// Genera hoja de permisos
	function hojaPermisos(permisoscalculados, permisomodel, jerarquiasById, personasByCodPlaza, personasByLogin){
		const deferPermiso = Q.defer();
		const restriccionPermisos = {};

		if (!permisoscalculados.superuser){
			restriccionPermisos.$and = [];
			restriccionPermisos.$and.push({'jerarquialectura': {'$in': permisoscalculados.jerarquialectura}});
			const aux = {};
			aux['jerarquialectura.' + permisoscalculados.jerarquialectura.length] = {'$exists': false};
			restriccionPermisos.$and.push(aux);
		}

		permisomodel.find(restriccionPermisos, function (err, data) {
			if (err) {
				deferPermiso.reject(err);
			} else {
				const ws = {};
				let	i = 0,
					fila = 1;

				ws[XLSX.utils.encode_cell({'c': 0, 'r': 0})] = {'v': 'Login', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 1, 'r': 0})] = {'v': 'Código plaza', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 2, 'r': 0})] = {'v': 'Id Jerarquía', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 3, 'r': 0})] = {'v': 'Jerarquía', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 4, 'r': 0})] = {'v': 'Nivel de jerarquía', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 5, 'r': 0})] = {'v': 'Escritura', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 6, 'r': 0})] = {'v': 'Lectura', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 7, 'r': 0})] = {'v': 'Administrador', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 8, 'r': 0})] = {'v': 'Puede dar permisos', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 9, 'r': 0})] = {'v': 'Descripción', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 10, 'r': 0})] = {'v': 'Recibió permisos de', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 11, 'r': 0})] = {'v': 'Habilitado', 't': 's'};
				ws[XLSX.utils.encode_cell({'c': 12, 'r': 0})] = {'v': 'Correo', 't': 's'};

				while (i < data.length) {
					const permiso = data[i];
					const cellLogin = {'v': typeof permiso.login === 'undefined' || permiso.login === null ? '-' : permiso.login, 't': 's'};
					const cellPlaza = {'v': typeof permiso.codplaza === 'undefined' || permiso.codplaza === null ? '-' : permiso.codplaza, 't': 's'};

					const cellAdministrador = {'v': typeof permiso.superuser === 'undefined' || permiso.superuser < 1 ? 'NO' : 'SÍ', 't': 's'};
					const cellGrantoption = {'v': typeof permiso.grantoption === 'undefined' || !permiso.grantoption ? 'NO' : 'SÍ', 't': 's'};
					const cellDescripcion = {'v': typeof permiso.descripcion === 'undefined' || permiso.descripcion === null ? '' : permiso.descripcion, 't': 's'};
					const cellcodPlazaGrantt = {'v': typeof permiso.cod_plaza_grantt === 'undefined' || permiso.cod_plaza_grantt === null ? '-' : permiso.cod_plaza_grantt, 't': 's'};

					const idsjerarquias = [].concat(permiso.jerarquiadirectaescritura, permiso.jerarquiadirectalectura);
					require('uniq')(idsjerarquias);

					for (let j = 0; j < idsjerarquias.length; j += 1) {
						const idjerarquia = idsjerarquias[j];

						ws[XLSX.utils.encode_cell({'c': 0, 'r': fila})] = cellLogin;
						ws[XLSX.utils.encode_cell({'c': 1, 'r': fila})] = cellPlaza;
						ws[XLSX.utils.encode_cell({'c': 2, 'r': fila})] = {'v': idjerarquia, 't': 'n'};
						ws[XLSX.utils.encode_cell({'c': 3, 'r': fila})] = {'v': jerarquiasById[idjerarquia] ? jerarquiasById[idjerarquia].nombrelargo : '', 't': 's'};
						ws[XLSX.utils.encode_cell({'c': 4, 'r': fila})] = {'v': jerarquiasById[idjerarquia] ? jerarquiasById[idjerarquia].ancestros.length : '', 't': 'n'};
						ws[XLSX.utils.encode_cell({'c': 5, 'r': fila})] = {'v': 'SÍ', 't': 's'};
						ws[XLSX.utils.encode_cell({'c': 6, 'r': fila})] = {'v': 'SÍ', 't': 's'};
						ws[XLSX.utils.encode_cell({'c': 7, 'r': fila})] = cellAdministrador;
						ws[XLSX.utils.encode_cell({'c': 8, 'r': fila})] = cellGrantoption;
						ws[XLSX.utils.encode_cell({'c': 9, 'r': fila})] = cellDescripcion;
						ws[XLSX.utils.encode_cell({'c': 10, 'r': fila})] = cellcodPlazaGrantt;
						if (permiso.codplaza){
							ws[XLSX.utils.encode_cell({'c': 11, 'r': fila})] = {'v': personasByCodPlaza[permiso.codplaza] && personasByCodPlaza[permiso.codplaza].habilitado ? 1 : 0, 't': 'n'};
							ws[XLSX.utils.encode_cell({'c': 12, 'r': fila})] = {'v': personasByCodPlaza[permiso.codplaza] ? personasByCodPlaza[permiso.codplaza].login + '@carm.es' : (personasByLogin[permiso.login] ? (permiso.login + '@carm.es') : '-'), 't': 's'};
						} else if (permiso.login){
							ws[XLSX.utils.encode_cell({'c': 11, 'r': fila})] = {'v': personasByLogin[permiso.login] && personasByLogin[permiso.login].habilitado ? 1 : 0, 't': 'n'};
							ws[XLSX.utils.encode_cell({'c': 12, 'r': fila})] = {'v': personasByLogin[permiso.login] ? permiso.login + '@carm.es' : '', 't': 's'};
						}

						fila += 1;
					}

					i += 1;
				}

				ws['!ref'] = XLSX.utils.encode_range({s: {'c': 0, 'r': 0}, e: {'c': 13, 'r': fila}});
				deferPermiso.resolve({'wsName': 'Permisos', 'sheet': ws});
			}
		});

		return deferPermiso.promise;
	}
	module.exports.exportarInforme = function (req, res) {
		const models = req.metaenvironment.models,
			cfg = req.metaenvironment.cfg,
			regAnyo = new RegExp(/a2\d{3}$/);
		if ((typeof req.params.year === 'undefined') || (req.params.year === null) || (!regAnyo.test(req.params.year))) {
			req.eh.missingParameterHelper(res, 'year');

			return;
		}

		const year = req.params.year;
		const personamodel = models.persona();
		const procedimientomodel = models.procedimiento();
		const jerarquiamodel = models.jerarquia();
		const permisomodel = models.permiso();

		const jerarquiasById = {},
			personasByCodPlaza = {},
			personasByLogin = {};

		const promises = [];
		const promesaCacheJerarquia = Q.defer();
		
		promises.push(promesaCacheJerarquia.promise);

		jerarquiamodel.find({}, {'id': true, 'nombrelargo': true, 'ancestros': true}, function(err, jerarquias){
			if (err){
				promesaCacheJerarquia.reject(err);
			} else {
				jerarquias.forEach(function(jer){
					jerarquiasById[jer.id] = jer;
				});
				promesaCacheJerarquia.resolve();
			}
		});

		/*** los datos sobre personas solo están disponibles para superuser **/
		if (req.user.permisoscalculados.superuser){
			const promesaCachePersonas = Q.defer();
			promises.push(promesaCachePersonas.promise);
			personamodel.find({}, {codplaza: true, login: true, nombre: true, apellidos: true, habilitado: true}, function (err, p) {
				if (err) {
					promesaCachePersonas.reject(err);
				} else {
					p.forEach(function(persona){
						if (persona.codplaza && persona.codplaza.trim() !== ''){
							personasByCodPlaza[persona.codplaza] = persona;
						}
						if (persona.login && persona.login.trim() !== ''){
							personasByLogin[persona.login] = persona;
						}

					});
					promesaCachePersonas.resolve(p);
				}
			});
		}

		Q.all(promises).then(function(loads){
			const promesasExcel = [];

			var deferBD = Q.defer();
			promesasExcel.push(deferBD.promise);

			// Genera hoja de usuarios (SOLO PARA SUPERUSER)
			if (loads.length > 1){
				promesasExcel.push(hojaUsuarios(loads[1]));
			}

			// Genera la hoja de permisos (SOLO PARA SUPERUSER Y GRANT)
			if (req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser){
				promesasExcel.push(hojaPermisos(req.user.permisoscalculados, permisomodel, jerarquiasById, personasByCodPlaza, personasByLogin));
			}
			let restriccionProcedimientos = {'$or': [{'oculto': {'$exists': false}}, {'$and': [{'oculto': {'$exists': true}}, {'oculto': false}]}]};

			if (!req.user.permisoscalculados.superuser) {
				restriccionProcedimientos = {'$and': [restriccionProcedimientos, {'codigo': {'$in': req.user.permisoscalculados.procedimientoslectura}}]};
			}
			// Genera hoja General (PARA TODOS)
			procedimientomodel.find(restriccionProcedimientos, {'codigo': true, 'denominacion': true, 'idjerarquia': true, 'responsables': true, 'cod_plaza': true, 'periodos': true, 'ancestros': true}, function (err, procedimientos) {
				if (err) {
					logger.error(err);
					deferBD.reject(err);
				} else {
					module.exports.rellenarProcedimientos(procedimientos, year, models, personasByCodPlaza).then(function (ws) {
						deferBD.resolve({'wsName': 'BD', 'sheet': ws});
					}, function (erro) {
						logger.error(erro);
						deferBD.reject(erro);
					});
				}
			});
			// Genera hoja General Ocultos (SOLO SUPERUSER)
			if (req.user.permisoscalculados.superuser){
				const deferBDOcultos = Q.defer();
				promesasExcel.push(deferBDOcultos.promise);
				procedimientomodel.find({'$and': [{'oculto': {'$exists': true}}, {'oculto': true}]}, {'codigo': true, 'denominacion': true, 'idjerarquia': true, 'responsables': true, 'cod_plaza': true, 'periodos': true, 'ancestros': true}, function (err, procedimientos) {
					if (err) {
						logger.error(err);
						deferBDOcultos.reject(err);
					} else {
						rellenarProcedimientos(procedimientos, year, models, personasByCodPlaza).then(function (ws) {
							deferBDOcultos.resolve({'wsName': 'BD Ocultos', 'sheet': ws});
						}, function (erro) {
							logger.error(erro);
							deferBDOcultos.reject(err);
						});
					}
				});
			}
			Q.all(promesasExcel).then(function (wss) {
				const wb = new Workbook();
				wss.forEach(function(ws) {
					if (typeof ws === 'object') {
						wb.SheetNames.push(ws.wsName);
						wb.Sheets[ws.wsName] = ws.sheet;
					}
				});
				const time = new Date().getTime();

				XLSX.writeFile(wb, cfg.prefixtmp + time + '.xlsx');
				res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time)});
			}, req.eh.errorHelper(res));
		});
	};
	

	function download(req, res) {
		const cfg = req.metaenvironment.cfg;
		const filename = req.params.token + (req.query.extension ? req.query.extension : '.xlsx'),
			rutaefectiva = path.resolve(cfg.prefixtmp, filename);
		if (md5(cfg.downloadhashprefix + req.params.token) === req.params.hash) {
			fs.exists(rutaefectiva, function(exists){
				if (exists) {
					if (path.dirname(rutaefectiva) + path.sep === cfg.prefixtmp) {
						res.download(rutaefectiva, filename, function (err){
							if (err) {
								logger.error(err);
							} else {
								logger.log('Fichero ' + rutaefectiva + ' descargado');
								fs.unlink(rutaefectiva, function (erro){
									if (erro) {
										logger.error('No se ha podido borrar el fichero ', rutaefectiva);
									} else {
										logger.log('Fichero', rutaefectiva, 'borrado');
									}
								});
							}
						});
					} else {
						logger.error('Acceso denegado:', rutaefectiva);
						req.eh.unauthorizedHelper(res);
					}
				} else {
					logger.error('Fichero no válido', rutaefectiva);
					req.eh.notFoundHelper(res);
				}
			});
		} else {
			req.eh.notFoundHelper(res);
		}
	}

	module.exports.mapReducePeriodosExpress = function(req, res){
		const models = req.metaenvironment.models;
		mapReducePeriodos(models, null, req.user.permisoscalculados).then(req.eh.okHelper(res), req.eh.errorHelper(res));
	};

	module.exports.mapReducePeriodos = mapReducePeriodos;
	module.exports.completarTabla = completarTabla;
	module.exports.download = download;
	module.exports.rellenarProcedimientos = rellenarProcedimientos;

})(module, console);
