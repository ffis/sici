(function(exports, logger){
	'use strict';

	var XLSX = require('xlsx');

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

	exports.mapReducePeriodos = function (Q, models, idjerarquia, permisoscalculados ) {
		/* TODO: replace this shit of code. MapReduce sucks! */
		var Procedimiento = models.procedimiento();
		var deferMR = Q.defer();
		var restriccion = {};
		if (typeof idjerarquia !== 'undefined' && idjerarquia != null){
			restriccion['ancestros.id'] = idjerarquia;
		}
		restriccion.oculto = {'$ne': true};
		restriccion.eliminado = {'$ne': true};

		if (typeof permisoscalculados !== 'undefined' && permisoscalculados && !permisoscalculados.superuser)
		{
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
			restriccion.codigo = { '$in': permisoscalculados.procedimientosdirectalectura
							.concat(permisoscalculados.procedimientoslectura)
							.concat(permisoscalculados.procedimientosdirectaescritura)
							.concat(permisoscalculados.procedimientosescritura) };
		}

		Procedimiento.find(restriccion, {'ancestros.id': 1, 'periodos': 1}, function(error, procedimientos){
			if (error){
				deferMR.reject(error);
			}


			var returnValue = { };
			var d = new Date();

			//map phase
			for (var i = 0, j = procedimientos.length; i < j; i++)
			{
				for (var i2 = 0, j2 = procedimientos[i].ancestros.length; i2 < j2; i2++)
				{
					for (var anualidad = 2013; anualidad <= d.getFullYear(); anualidad++)
					{
						if (typeof procedimientos[i].periodos['a' + anualidad] === 'undefined')
						{
							logger.error('El procedimiento ' + procedimientos[i].codigo + ' no tiene anualidad ' + anualidad);
							continue;
						}
						var key = { anualidad: anualidad, idjerarquia: procedimientos[i].ancestros[i2].id };
						var keyStr = JSON.stringify(key);
						if (typeof returnValue [ keyStr ] === 'undefined'){
							returnValue [ keyStr ] = [];
						}
						returnValue [ keyStr ].push(procedimientos[i].periodos['a' + anualidad]);
					}
				}
			}



			var fnReduce = function(key, values){
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
					for (var mes = 0; mes < 12; mes++) {
						sumas[attr][mes] = 0;
						for (var i = 0, j = values.length; i < j; i++) {
							if (values[i][attr]) {
								sumas[attr][mes] += parseInt(values[i][attr][mes]);
							}
						}
					}
				});

				sumas.totalsolicitudes = 0;
				sumas.numProcedimientos = values.length;
				sumas.procedimientos = [];
				sumas.numProcedimientosConSolicitudes = 0;
				sumas.t_medio_naturales = [];
				sumas.t_medio_habiles = [];
				for (mes = 0; mes < 12; mes++){
					sumas.t_medio_naturales.push( { count: 0, value: 0} );
					sumas.t_medio_habiles.push( { count: 0, value: 0} );
				}


				for (var i = 0, j = values.length; i < j; i++) {
					sumas.procedimientos.push(values[i].codigo);
					if (values[i].totalsolicitudes > 0) {
						sumas.numProcedimientosConSolicitudes++;
						sumas.totalsolicitudes += values[i].totalsolicitudes;
					}
					if (key.anualidad > 2013){
						for (mes = 0; mes < 12; mes++){
							if (values[i].total_resueltos[mes] > 0)
							{
								if (values[i].t_medio_naturales[mes] > 0)
								{
									sumas.t_medio_naturales[mes].count++;
									sumas.t_medio_naturales[mes].value += values[i].t_medio_naturales[mes];
								}
								if (values[i].t_medio_habiles[mes] > 0)
								{
									sumas.t_medio_habiles[mes].count++;
									sumas.t_medio_habiles[mes].value += values[i].t_medio_habiles[mes];
								}
							}
						}
					}
				}
				sumas.t_medio_naturales_anual = { count: 0, value: 0, avg: 0 };
				sumas.t_medio_habiles_anual = { count: 0, value: 0, avg: 0 };
				for (mes = 0; mes < 12; mes++){
					sumas.t_medio_naturales_anual.count += sumas.t_medio_naturales[mes].count;
					sumas.t_medio_naturales_anual.value += sumas.t_medio_naturales[mes].value;
					sumas.t_medio_habiles_anual.count += sumas.t_medio_habiles[mes].count;
					sumas.t_medio_habiles_anual.value += sumas.t_medio_habiles[mes].value;

					sumas.t_medio_naturales[mes] = (sumas.t_medio_naturales[mes].count === 0 ) ? 0 : parseFloat( (sumas.t_medio_naturales[mes].value / sumas.t_medio_naturales[mes].count).toFixed(2) );
					sumas.t_medio_habiles[mes] = (sumas.t_medio_habiles[mes].count === 0 ) ? 0 : parseFloat( (sumas.t_medio_habiles[mes].value / sumas.t_medio_habiles[mes].count).toFixed(2) );
				}
				sumas.t_medio_naturales_anual.avg = (sumas.t_medio_naturales_anual.count === 0 ) ? 0 : parseFloat( (sumas.t_medio_naturales_anual.value / sumas.t_medio_naturales_anual.count).toFixed(2) );
				sumas.t_medio_habiles_anual.avg = (sumas.t_medio_habiles_anual.count === 0 ) ? 0 : parseFloat( (sumas.t_medio_habiles_anual.value / sumas.t_medio_habiles_anual.count).toFixed(2) );

				return sumas;
			};
			//reduce phase
			var results = [];
			for (var keyStr in returnValue){
				var keyV = JSON.parse(keyStr);
				results.push({_id: keyV, value: fnReduce(keyV, returnValue[keyStr]) });
			}


			if (typeof idjerarquia === 'undefined' || idjerarquia === null ){
				deferMR.resolve(results);
			} else {
				var periodos = {};
				results.forEach(function (result) {
					if (result._id.idjerarquia === idjerarquia) {
						periodos[parseInt(result._id.anualidad)] = result.value;
					}
				});
				deferMR.resolve(periodos);
			}
		});

		return deferMR.promise;
	};


	exports.completarTabla = function (periodo, ws) {
		var mes = 0;
		var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
		var indicadores = ['Solicitados', 'Iniciados', 'Quejas presentadas en el mes', 'Recursos presentados en el mes', 'Resueltos < 1', 'Resueltos 1 < 5',
			'Resueltos 5 < 10', 'Resueltos 10 < 15', 'Resueltos 15 < 30', 'Resueltos 30 < 45', 'Resueltos > 45',
			'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', 'Resueltos por Prescripción/Caducidad (Resp. Admón.)',
			'En plazo', 'Tiempo medio en días hábiles descontando Tiempo de suspensiones', 'Tiempo medio en días naturales',
			'Resueltos totales', 'Fuera de plazo', 'Pendientes'];
		var indicadoresDatabase = ['solicitados', 'iniciados', 'quejas', 'recursos', 'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30',
			'resueltos_45', 'resueltos_mas_45', 'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion', 'en_plazo', 't_medio_habiles', 't_medio_naturales',
			'total_resueltos', 'fuera_plazo', 'pendientes'];
		for (mes = 0; mes < 12; mes++) {
			var cellValue = {v: meses[mes], t: 's'};
			var cellValueRef = XLSX.utils.encode_cell({c: 4 + mes, r: 16});
			ws[cellValueRef] = cellValue;
		}
		for (var i = 0; i < indicadoresDatabase.length; i++) {
			ws[ XLSX.utils.encode_cell({c: 3, r: 17 + i}) ] = {v: indicadores[i], t: 's'};
			for (mes = 0; mes < 12; mes++) {
				ws[ XLSX.utils.encode_cell({c: 4 + mes, r: 17 + i}) ] = {v: periodo[indicadoresDatabase[i]] ? periodo[indicadoresDatabase[i]][mes] : 0, t: 'n'};
			}
		}
		return ws;
	};


	exports.tablaResultadosJerarquiaDesglosado = function(Q, models, jerarquia, permisoscalculados) {
		var defer = Q.defer();
		var defer_descendientes = Q.defer();
		var Jerarquia = models.jerarquia();
		var indicadores = ['Solicitados', 'Iniciados', 'Quejas presentadas en el mes', 'Recursos presentados en el mes', 'Resueltos < 1', 'Resueltos 1 < 5',
			'Resueltos 5 < 10', 'Resueltos 10 < 15', 'Resueltos 15 < 30', 'Resueltos 30 < 45', 'Resueltos > 45',
			'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', 'Resueltos por Prescripción/Caducidad (Resp. Admón.)',
			'En plazo',
			'Resueltos totales', 'Fuera de plazo', 'Pendientes'];
		var indicadoresDatabase = ['solicitados', 'iniciados', 'quejas', 'recursos', 'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30',
			'resueltos_45', 'resueltos_mas_45', 'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion', 'en_plazo',
			'total_resueltos', 'fuera_plazo', 'pendientes'];


		Jerarquia.find(
			{ ancestrodirecto: jerarquia.id },
			{ id: true, _id: false, nombre: true, numProcedimientos: true, nombrelargo: true },
			function(err, hijos){
				if (err){
					defer_descendientes.reject(err);
				}
				else {
					defer_descendientes.resolve(hijos);
				}
			}
		);

		Q.all([defer_descendientes.promise, exports.mapReducePeriodos(Q, models, null, permisoscalculados)]).then(
			function(allData) {
				var hijos = allData[0], results = allData[1];
				hijos = ([ {nombrelargo: jerarquia.nombrelargo, nombre: jerarquia.nombre, id: jerarquia.id} ]).concat(hijos);
				var ihijos = [];

				hijos.forEach(function(hijo){ ihijos.push(hijo.id); });

				var periodos = {};
				results.forEach(function(result) {
					if (ihijos.indexOf(result._id.idjerarquia) !== -1) {
						var idjerarquia = result._id.idjerarquia;
						if (typeof periodos[idjerarquia] === 'undefined'){
							periodos[idjerarquia] = {};
						}
						periodos[idjerarquia][parseInt(result._id.anualidad)] = result.value;
					}
				});
				var rowhead = 4;
				var columnhead = 4;
				var ws = {};
				var ic = columnhead + 1;
				var max_r = ir;
				var max_c = ic;
				// linea de cabecera
				var cellValue;
				var cellValueRef;

				for (var i = 0, j = hijos.length, k = 0; i < j; i++)
				{
					var h = hijos[i];

					if (typeof periodos[ihijos[i]] === 'undefined'){ continue; }

					cellValue = {v: h.nombrelargo, t: 's'};
					cellValueRef = XLSX.utils.encode_cell({c: ic + k, r: rowhead});
					ws[cellValueRef] = cellValue;
					k++;
				}
				max_c = ic + k;
				ic = columnhead;
				var ir = rowhead + 1;
				if (typeof periodos[jerarquia.id] === 'undefined'){
					periodos[jerarquia.id] = {};
				}

				for (var anualidad = 2014; typeof periodos[jerarquia.id][anualidad] !== 'undefined'; anualidad++)
				{
					ws[ XLSX.utils.encode_cell({c: ic, r: ir}) ] = {v: anualidad, t: 'n'};
					ir++;
					for (var ind = 0, l2 = indicadoresDatabase.length; ind < l2; ind++){
						ws[ XLSX.utils.encode_cell({c: ic, r: ir}) ] = {v: indicadores[ind], t: 's'};
						ir++;
					}
				}
				max_r = ir;

				// RESTO DE LINEAS
				ic = columnhead + 1;
				ir = rowhead + 1;

				// PARA CADA HIJO UNA COLUMNA
				for (var i = 0, l = hijos.length; i < l; i++)
				{
					var ir = rowhead + 1;
					if (typeof periodos[ihijos[i]] === 'undefined')
					{
						continue;
					}
					for (var anualidad = 2014; typeof periodos[ihijos[i]][anualidad] !== 'undefined'; anualidad++)
					{
						/*cellValue = {v: anualidad, t:'n'};
						cellValueRef = XLSX.utils.encode_cell({c: ic, r: ir});
						ws[cellValueRef] = cellValue;		*/
						ir++;
						for (var ind = 0, l2 = indicadoresDatabase.length; ind < l2; ind++)
						{
							var valor = periodos[ihijos[i]][anualidad][indicadoresDatabase[ind]];
							var ivalor = valor[0] + valor[1] + valor[2] + valor[3] + valor[4] + valor[5] + valor[6] + valor[7] + valor[8] + valor[9] + valor[10] + valor[11];

							cellValue = {v: ivalor, t: 'n'};
							cellValueRef = XLSX.utils.encode_cell({c: ic, r: ir});
							ws[cellValueRef] = cellValue;
							ir++;
						}
					}
					ic++;
				}

				ws['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: max_c, r: max_r}});
				defer.resolve(ws);
			},
			function(err) {
				defer.reject(err);
			}
		);
		return defer.promise;
	};

	exports.tablaResultadosJerarquia = function (models, app, md5, Q, cfg) {
		return function (req, res) {
			if ((typeof req.params.jerarquia === 'undefined') || (req.params.jerarquia === null)) {
				logger.error('No se ha definido el parámetro "jerarquia"');
				res.status(500).end();
				return;
			}
			var Jerarquia = models.jerarquia();
			var deferNombre = Q.defer();
			var deferSheets = [Q.defer(), Q.defer()];
			var jerarquia;
			Jerarquia.findOne({'id': parseInt(req.params.jerarquia)}, function (err, data) {
				if (err) {
					logger.error('No se ha definido el parámetro "jerarquia"');
					deferNombre.reject(err);
				} else {
					jerarquia = data;
					deferNombre.resolve(data.nombrelargo);
				}
			});
			deferNombre.promise.then(function (denominacion) {
				var d = new Date();
				var wb = new Workbook();
				exports.mapReducePeriodos(Q, models, parseInt(req.params.jerarquia), req.user.permisoscalculados).then(function (periodos) {
					for (var anualidad = 2013; anualidad <= d.getFullYear(); anualidad++) {
						var ws = {};

						ws[ XLSX.utils.encode_cell({c: 4, r: 5}) ] = {v: denominacion, t: 's'};
						ws['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: 20, r: 40}});
						/* TODO: revisar ese rango */
						exports.completarTabla(periodos[anualidad], ws);

						var wsName = '' + anualidad;
						wb.SheetNames.push(wsName);
						wb.Sheets[wsName] = ws;
					}
					deferSheets[0].resolve();
				}, function (err) {
					logger.error('Error al hacer el map reduce ' + err);
					deferSheets[0].reject(err);
				});

				exports.tablaResultadosJerarquiaDesglosado(Q, models, jerarquia, req.user.permisoscalculados).then(
					function(ws2){
						var wsName = 'resumen descendientes';
						wb.SheetNames.push(wsName);
						wb.Sheets[wsName] = ws2;
						deferSheets[1].resolve();
					},
					function(err){
						logger.error('Error al hacer el map reduce ' + err);
						deferSheets[1].reject(err);
					}
				);

				Q.all([deferSheets[0].promise, deferSheets[1].promise]).then(function(){
					var time = new Date().getTime();
					var path = app.get('prefixtmp');
					XLSX.writeFile(wb, path + time + '.xlsx');
					logger.log({'time': time, 'hash': md5(cfg.downloadhashprefix + time)});
					res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time)});
				}, function(err){
					logger.error(err);
					res.status(500).end();
					return;
				});
			}, function (err) {
				logger.error(err);
				res.status(500).end();
				return;
			});
		};
	};

	exports.tablaResultadosProcedimiento = function (models, app, md5, Q, cfg) {
		return function (req, res) {
			if ((typeof req.params.codigo === 'undefined') || (req.params.codigo === null)) {
				logger.error('No se ha definido el parámetro "codigo"');
				res.status(500).end();
				return;
			}
			if ((typeof req.params.year === 'undefined') || (req.params.year === null)) {
				logger.error('No se ha definido el parámetro "year"');
				res.status(500).end();
				return;
			}
			var Procedimiento = models.procedimiento();
			var datosBasicosNombre = ['Código', 'Denominación', 'Tipo', 'Código de plaza'];
			var datosBasicos = ['codigo', 'denominacion', 'tipo', 'cod_plaza'];
			var datosFechasNombre = ['Fecha de creación', 'Fecha de versión'];
			var datosFechas = ['fecha_creacion', 'fecha_version'];
			var datosBasicosAnualidadNombre = ['Pendientes iniciales (a 31-12)', 'Plazo CS/ANS (días hábiles)', 'Plazo CS/ANS (días naturales)', 'Plazo máximo legal para resolver (días naturales)',
				'Plazo máximo legal para resolver (días hábiles)'];
			var datosBasicosAnualidad = ['pendientes_iniciales', 'plazo_CS_ANS_habiles', 'plazo_CS_ANS_naturales', 'plazo_maximo_resolver', 'plazo_maximo_responder'];

			Procedimiento.findOne({codigo: req.params.codigo}, {}, function (err, proc) {
				if (err) {
					logger.error(err);
					res.status(500);
					res.end();
				} else {
					var wb = new Workbook();
					var ws = {};
					var pos = 1;
					for (var i = 0; i < datosBasicos.length; i++) {
						var value = proc[datosBasicos[i]];

						ws[ XLSX.utils.encode_cell({c: 4, r: pos}) ] = {v: (value === null || typeof value === 'undefined') ? '' : value, t: 's'};
						ws[ XLSX.utils.encode_cell({c: 3, r: pos}) ] = {v: datosBasicosNombre[i], t: 's'};
						pos++;
					}
					for (var i = 0; i < datosFechas.length; i++) {
						var value = proc[datosFechas[i]];

						ws[ XLSX.utils.encode_cell({c: 4, r: pos}) ] = {v: (value === null || typeof value === 'undefined') ? '' : value, t: 'd'};
						ws[ XLSX.utils.encode_cell({c: 3, r: pos}) ] = {v: datosFechasNombre[i], t: 's'};
						pos++;
					}
					for (var i = 0; i < datosBasicosAnualidad.length; i++) {
						var value = proc.periodos[req.params.year][datosBasicosAnualidad[i]];

						ws[ XLSX.utils.encode_cell({c: 4, r: pos}) ] = {v: (value === null || typeof value === 'undefined') ? '' : value, t: 'n'};
						ws[ XLSX.utils.encode_cell({c: 3, r: pos}) ] = {v: datosBasicosAnualidadNombre[i], t: 's'};
						pos++;
					}
					var padreDefer = Q.defer();
					if (typeof proc.padre !== 'undefined' && proc.padre !== null) {
						Procedimiento.findOne({codigo: proc.padre}, {codigo: true, denominacion: true}, function (err, padre) {
							if (err) {
								padreDefer.reject(err);
							} else {
								ws[ XLSX.utils.encode_cell({c: 4, r: pos}) ] = {v: '[' + padre.codigo + '] ' + padre.denominacion, t: 's'};
								ws[ XLSX.utils.encode_cell({c: 3, r: pos}) ] = {v: 'Padre', t: 's'};
								padreDefer.resolve();
							}
						});
					} else {
						padreDefer.resolve();
					}
					exports.completarTabla(proc.periodos[req.params.year], ws);
					padreDefer.promise.then(function () {

						ws['!ref'] = XLSX.utils.encode_range( {s: {c: 0, r: 0}, e: {c: 20, r: 40}} );
						wb.SheetNames.push('Procedimiento');
						wb.Sheets.Procedimiento = ws;
						var time = new Date().getTime();
						var path = app.get('prefixtmp');
						XLSX.writeFile(wb, path + time + '.xlsx');
						res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time)});
					}, function (erro) {
						logger.error(erro);
						res.status(500).end();
					});
				}
			});
		};
	};

	exports.exportarInforme = function (models, app, md5, Q, cfg) {
		return function (req, res) {
			if ((typeof req.params.year === 'undefined') || (req.params.year === null)) {
				logger.error('No se ha definido el parámetro "year"');
				res.status(500).end();
				return;
			}
			var regAnyo = new RegExp(/a2\d{3}$/);
			if (!regAnyo.test(req.params.year)) {
				logger.error('Parámetro mal formado');
				res.status(500).end();
				return;
			}

			var hojaUsuarios = function (Q, personas){
				var defer = Q.defer(),
					ws = {};
				ws[XLSX.utils.encode_cell({c: 0, r: 0})] = {v: 'Nombre', t: 's'};
				ws[XLSX.utils.encode_cell({c: 1, r: 0})] = {v: 'Apellidos', t: 's'};
				ws[XLSX.utils.encode_cell({c: 2, r: 0})] = {v: 'Login', t: 's'};
				ws[XLSX.utils.encode_cell({c: 3, r: 0})] = {v: 'Código plaza', t: 's'};
				ws[XLSX.utils.encode_cell({c: 4, r: 0})] = {v: 'Habilitado', t: 's'};
				for (var i = 1, j = personas.length; i <= j; i++) {
					var persona = personas[i - 1];
					ws[ XLSX.utils.encode_cell({c: 0, r: i}) ] = {v: persona.nombre, t: 's'};
					ws[ XLSX.utils.encode_cell({c: 1, r: i}) ] = {v: persona.apellidos, t: 's'};
					ws[ XLSX.utils.encode_cell({c: 2, r: i}) ] = {v: persona.login, t: 's'};
					ws[ XLSX.utils.encode_cell({c: 3, r: i}) ] = {v: persona.codplaza, t: 's'};
					ws[ XLSX.utils.encode_cell({c: 4, r: i}) ] = {v: persona.habilitado ? 1 : 0, t: 'n'};
				}

				ws['!ref'] = XLSX.utils.encode_range( {s: {c: 0, r: 0}, e: {c: 5, r: personas.length + 1}} );
				defer.resolve({'wsName': 'Usuarios', 'sheet': ws});

				return defer.promise;
			};
			// Genera hoja de permisos
			var hojaPermisos = function(Q, Permiso, jerarquiasById, personasByCodPlaza, personasByLogin)
			{
				var deferPermiso = Q.defer();
				var restriccionPermisos = {};

				if (!req.user.permisoscalculados.superuser){
					restriccionPermisos['$and'] = [];
					restriccionPermisos['$and'].push({ 'jerarquialectura': { '$in': req.user.permisoscalculados.jerarquialectura }});
					var aux = {};
					aux['jerarquialectura.' + req.user.permisoscalculados.jerarquialectura.length ] = {'$exists': false};
					restriccionPermisos['$and'].push(aux);
				}

				Permiso.find(restriccionPermisos, function (err, data) {
					if (err) {
						deferPermiso.reject(err);
					} else {
						var ws = {};
						var i = 0, pos = 1;

						ws[ XLSX.utils.encode_cell({c: 0, r: 0}) ] = {v: 'Login', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 1, r: 0}) ] = {v: 'Código plaza', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 2, r: 0}) ] = {v: 'Id Jerarquía', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 3, r: 0}) ] = {v: 'Jerarquía', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 4, r: 0}) ] = {v: 'Nivel de jerarquía', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 5, r: 0}) ] = {v: 'Escritura', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 6, r: 0}) ] = {v: 'Lectura', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 7, r: 0}) ] = {v: 'Administrador', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 8, r: 0}) ] = {v: 'Puede dar permisos', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 9, r: 0}) ] = {v: 'Descripción', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 10, r: 0}) ] = {v: 'Recibió permisos de', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 11, r: 0}) ] = {v: 'Habilitado', t: 's'};
						ws[ XLSX.utils.encode_cell({c: 12, r: 0}) ] = {v: 'Correo', t: 's'};


						while (i < data.length) {
							var permiso = data[i];
							var cellLogin = {v: typeof permiso.login === 'undefined' || permiso.login === null ? '-' : permiso.login, t: 's'};
							var cellPlaza = {v: typeof permiso.codplaza === 'undefined' || permiso.codplaza === null ? '-' : permiso.codplaza, t: 's'};

							var cellAdministrador = {v: typeof permiso.superuser === 'undefined' || permiso.superuser < 1 ? 'NO' : 'SÍ', t: 's'};
							var cellGrantoption = {v: typeof permiso.grantoption === 'undefined' || !permiso.grantoption ? 'NO' : 'SÍ', t: 's'};
							var cellDescripcion = {v: typeof permiso.descripcion === 'undefined' || permiso.descripcion === null ? '' : permiso.descripcion, t: 's'};
							var cellcodPlazaGrantt = {v: typeof permiso.cod_plaza_grantt === 'undefined' || permiso.cod_plaza_grantt === null ? '-' : permiso.cod_plaza_grantt, t: 's'};

							for (var j = 0; j < permiso.jerarquiadirectaescritura.length; j++) {
								var jerarquia = permiso.jerarquiadirectaescritura[j];

								ws[ XLSX.utils.encode_cell({c: 0, r: pos}) ] = cellLogin;
								ws[ XLSX.utils.encode_cell({c: 1, r: pos}) ] = cellPlaza;
								ws[ XLSX.utils.encode_cell({c: 2, r: pos}) ] = {v: jerarquia, t: 'n'};
								ws[ XLSX.utils.encode_cell({c: 3, r: pos}) ] = {v: jerarquiasById[ jerarquia ] ? jerarquiasById[ jerarquia ].nombrelargo : '', t: 's'};
								ws[ XLSX.utils.encode_cell({c: 4, r: pos}) ] = {v: jerarquiasById[ jerarquia ] ? jerarquiasById[ jerarquia ].ancestros.length : '', t: 'n'};
								ws[ XLSX.utils.encode_cell({c: 5, r: pos}) ] = {v: 'SÍ', t: 's'};
								ws[ XLSX.utils.encode_cell({c: 6, r: pos}) ] = {v: 'SÍ', t: 's'};
								ws[ XLSX.utils.encode_cell({c: 7, r: pos}) ] = cellAdministrador;
								ws[ XLSX.utils.encode_cell({c: 8, r: pos}) ] = cellGrantoption;
								ws[ XLSX.utils.encode_cell({c: 9, r: pos}) ] = cellDescripcion;
								ws[ XLSX.utils.encode_cell({c: 10, r: pos}) ] = cellcodPlazaGrantt;
								if (permiso.codplaza){
									ws[ XLSX.utils.encode_cell({c: 11, r: pos}) ] = {v: personasByCodPlaza[ permiso.codplaza ] && personasByCodPlaza[ permiso.codplaza ].habilitado ? 1 : 0, t: 'n'};
									ws[ XLSX.utils.encode_cell({c: 12, r: pos}) ] = {v: personasByCodPlaza[ permiso.codplaza ] ? personasByCodPlaza[ permiso.codplaza ].login + '@carm.es' : (!personasByLogin[ permiso.login ] ? '-' : (permiso.login + '@carm.es')), t: 's'};
								}else if (permiso.login){
									ws[ XLSX.utils.encode_cell({c: 11, r: pos}) ] = {v: personasByLogin[ permiso.login ] && personasByLogin[ permiso.login ].habilitado ? 1 : 0, t: 'n'};
									ws[ XLSX.utils.encode_cell({c: 12, r: pos}) ] = {v: personasByLogin[ permiso.login ] ? permiso.login + '@carm.es' : '', t: 's'};
								}

								pos++;
							}

							for (var j = 0; j < permiso.jerarquiadirectalectura.length; j++) {
								var jerarquiaLectura = permiso.jerarquiadirectalectura[j];
								if (permiso.jerarquiadirectaescritura.indexOf(jerarquiaLectura) === -1) {

									ws[ XLSX.utils.encode_cell({c: 0, r: pos}) ] = cellLogin;
									ws[ XLSX.utils.encode_cell({c: 1, r: pos}) ] = cellPlaza;
									ws[ XLSX.utils.encode_cell({c: 2, r: pos}) ] = {v: jerarquiaLectura, t: 'n'};
									ws[ XLSX.utils.encode_cell({c: 3, r: pos}) ] = {v: jerarquiasById[ jerarquia ] ? jerarquiasById[ jerarquiaLectura ].nombrelargo : '', t: 's'};
									ws[ XLSX.utils.encode_cell({c: 4, r: pos}) ] = {v: jerarquiasById[ jerarquia ] ? jerarquiasById[ jerarquiaLectura ].ancestros.length : '', t: 'n'};
									ws[ XLSX.utils.encode_cell({c: 5, r: pos}) ] = {v: 'NO', t: 's'};
									ws[ XLSX.utils.encode_cell({c: 6, r: pos}) ] = {v: 'SÍ', t: 's'};
									ws[ XLSX.utils.encode_cell({c: 7, r: pos}) ] = cellAdministrador;
									ws[ XLSX.utils.encode_cell({c: 8, r: pos}) ] = cellGrantoption;
									ws[ XLSX.utils.encode_cell({c: 9, r: pos}) ] = cellDescripcion;
									ws[ XLSX.utils.encode_cell({c: 10, r: pos}) ] = cellcodPlazaGrantt;
									if (permiso.codplaza){
										ws[ XLSX.utils.encode_cell({c: 11, r: pos}) ] = {v: personasByCodPlaza[ permiso.codplaza ] && personasByCodPlaza[ permiso.codplaza ].habilitado ? 1 : 0, t: 'n'};
										ws[ XLSX.utils.encode_cell({c: 12, r: pos}) ] = {v: personasByCodPlaza[ permiso.codplaza ] ? personasByCodPlaza[ permiso.codplaza ].login + '@carm.es' : (!permiso.login ? '-' : (permiso.login + '@carm.es')), t: 's'};
									}else if (permiso.login){
										ws[ XLSX.utils.encode_cell({c: 11, r: pos}) ] = {v: personasByLogin[ permiso.login ] && personasByLogin[ permiso.login ].habilitado ? 1 : 0, t: 'n'};
										ws[ XLSX.utils.encode_cell({c: 12, r: pos}) ] = {v: personasByLogin[ permiso.login ] ? permiso.login + '@carm.es' : '', t: 's'};
									}

									pos++;
								}
							}
							i++;
						}

						ws['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: 13, r: pos}});

						deferPermiso.resolve({'wsName': 'Permisos', 'sheet': ws});
					}
				});
				return deferPermiso.promise;
			};

			var year = req.params.year;
			var Persona = models.persona();
			var Procedimiento = models.procedimiento();
			var Jerarquia = models.jerarquia();
			var Permiso = models.permiso();

			var jerarquiasById = {};
			var personasByCodPlaza = {}, personasByLogin = {};


			var promesaCacheJerarquia = Q.defer();
			var promesaCachePersonas = Q.defer();


			Jerarquia.find({}, {'id': true, 'nombrelargo': true, 'ancestros': true}, function(err, jerarquias){
				if (err){
					promesaCacheJerarquia.reject(err);
				} else {
					jerarquias.forEach(function(jer){
						jerarquiasById[ jer.id ] = jer;
					});
					promesaCacheJerarquia.resolve();
				}
			});

			var personas = [];
			/*** los datos sobre solo están disponibles para superuser **/
			if (req.user.permisoscalculados.superuser){
				Persona.find({}, {codplaza: true, login: true, nombre: true, apellidos: true, habilitado: true}, function (err, p) {
					if (err) {
						promesaCachePersonas.reject(err);
					} else {
						personas = p;
						personas.forEach(function(persona){
							if (persona.codplaza && persona.codplaza.trim() !== ''){
								personasByCodPlaza[ persona.codplaza ] = persona;
							}
							if (persona.login && persona.login.trim() !== ''){
								personasByLogin[ persona.login ] = persona;
							}

						});
						promesaCachePersonas.resolve();
					}
				});
			} else {
				promesaCachePersonas.resolve();
			}

			Q.all([ promesaCacheJerarquia.promise, promesaCachePersonas.promise ]). then( function()
			{
				var promesasExcel = [];


				var deferBD = Q.defer();
				var deferBDOcultos = Q.defer();
				promesasExcel.push(deferBD.promise);
				promesasExcel.push(deferBDOcultos.promise);
				// Genera hoja de usuarios (SOLO PARA SUPERUSER)
				if (req.user.permisoscalculados.superuser){
					promesasExcel.push( hojaUsuarios(Q, personas) );
				}
				// Genera la hoja de permisos (SOLO PARA SUPERUSER Y GRANT)
				if (req.user.permisoscalculados.grantoption || req.user.permisoscalculados.superuser){
					promesasExcel.push( hojaPermisos(Q, Permiso, jerarquiasById, personasByCodPlaza, personasByLogin, req.user.permisoscalculados) );
				}
				var restriccionProcedimientos = {'$or': [{'oculto': {$exists: false}}, {'$and': [{'oculto': {$exists: true}}, {'oculto': false}]}]};
				if (!req.user.permisoscalculados.superuser) {
					var pids = []
							.concat(Array.isArray(req.user.permisoscalculados.procedimientosdirectalectura) ? req.user.permisoscalculados.procedimientosdirectalectura : [])
							.concat(Array.isArray(req.user.permisoscalculados.procedimientoslectura) ? req.user.permisoscalculados.procedimientoslectura : [])
							.concat(Array.isArray(req.user.permisoscalculados.procedimientosdirectaescritura) ? req.user.permisoscalculados.procedimientosdirectaescritura : [])
							.concat(Array.isArray(req.user.permisoscalculados.procedimientosescritura) ? req.user.permisoscalculados.procedimientosescritura : []);
					var r = { '$and' :
						[
							restriccionProcedimientos,
							{'codigo': {'$in': pids}}
						]
					};
					restriccionProcedimientos = r;
				}
				// Genera hoja General (PARA TODOS)
				Procedimiento.find(restriccionProcedimientos, {codigo: true, denominacion: true, idjerarquia: true, responsables: true, 'cod_plaza': true, periodos: true, ancestros: true}, function (err, procedimientos) {
					if (err) {
						logger.error(err);
						deferBD.reject(err);
					} else {
						exports.rellenarProcedimientos(procedimientos, year, Q, models, personasByCodPlaza).then(function (ws) {
							deferBD.resolve({'wsName': 'BD', 'sheet': ws});
						}, function (erro) {
							logger.error(erro);
							deferBD.reject(erro);
						});
					}
				});
				// Genera hoja General Ocultos (SOLO SUPERUSER)
				if (req.user.permisoscalculados.superuser){
					Procedimiento.find({'$and': [{'oculto': {$exists: true}}, {'oculto': true}]}, {codigo: true, denominacion: true, idjerarquia: true, responsables: true, 'cod_plaza': true, periodos: true, ancestros: true}, function (err, procedimientos) {
						if (err) {
							logger.error(err);
							deferBDOcultos.reject(err);
						} else {
							exports.rellenarProcedimientos(procedimientos, year, Q, models, personasByCodPlaza).then(function (ws) {
								deferBDOcultos.resolve({'wsName': 'BD Ocultos', 'sheet': ws});
							}, function (erro) {
								logger.error(erro);
								deferBDOcultos.reject(err);
							});
						}
					});
				} else {
					deferBDOcultos.resolve();
				}
				Q.all(promesasExcel).then(function (wss) {

					var wb = new Workbook();
					wss.forEach(function (ws) {
						if (typeof ws !== undefined && ws != null) {
							wb.SheetNames.push(ws.wsName);
							wb.Sheets[ws.wsName] = ws.sheet;
						}
					});
					var time = new Date().getTime();
					var path = app.get('prefixtmp');
					XLSX.writeFile(wb, path + time + '.xlsx');
					res.json({'time': time, 'hash': md5(cfg.downloadhashprefix + time)});
				}, function (err) {
					logger.error(err);
					res.status(500).end();
				});
			});
		};
	};


	exports.rellenarProcedimientos = function (procedimientos, year, Q, models, personasByCodPlaza) {
		var i = 0, j = 0;
		var deferProc = Q.defer();
		var indicadoresDatabase = ['solicitados', 'iniciados', 'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30',
			'resueltos_45', 'resueltos_mas_45', 'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion', 't_medio_naturales', 't_medio_habiles',
			'en_plazo', 'quejas', 'recursos'];
		var indicadores = ['Solicitados', 'Iniciados', 'Resueltos < 1', 'Resueltos 1 < 5', 'Resueltos 5 < 10', 'Resueltos 10 < 15', 'Resueltos 15 < 30',
			'Resueltos 30 < 45', 'Resueltos > 45', 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', 'Resueltos por Prescripción/Caducidad (Resp. Admón.)',
			'Tiempo medio en días naturales', 'Tiempo medio en días hábiles descontando Tiempo de suspensiones', 'En plazo', 'Quejas presentadas en el mes',
			'Recursos presentados en el mes'];
		var meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
		var precabeceras = ['Código', 'Denominación del procedimiento', 'Código Nivel 1', 'Denominación Nivel 1', 'Código Nivel 2', 'Denominación Nivel 2', 'Código Nivel 3', 'Denominación Nivel 3',
			'Código plaza responsable', 'Login responsable', 'Nombre responsable', 'Correo-e responsable', 'Teléfono responsable',
			'Plazo máximo legal para resolver (dias naturales)', 'Plazo máximo legal para resolver (dias hábiles)', 'Plazo CS /ANS (días naturales)',
			'Plazo CS /ANS (días hábiles)', 'Pendientes iniciales (a 31-12)'];

		var lastyear = parseInt(year.substring(1, 5)) - 1,
			lastyearstr = 'a' + lastyear,
			ws = {}, pos = 1;
			//coordenadasmerges = [];

		for (i = 0; i < precabeceras.length; i++) {
			ws[ XLSX.utils.encode_cell({c: pos++, r: 1}) ] = { v: precabeceras[i], t: 's'};
		}

		ws[ XLSX.utils.encode_cell({c: pos + 6, r: 0}) ] = {v: 'RESUELTOS EN LOS MESES DE ' + lastyear, t: 's'};

		for (i = 0; i < meses.length; i++) {
			ws[ XLSX.utils.encode_cell({c: pos++, r: 1}) ] = {v: meses[i], t: 's'};
		}

		for (i = 0; i < meses.length; i++) {
//			coordenadasmerges.push( XLSX.utils.encode_range( {s: {c: pos + 6, r: 0}, e: {c: pos + 6 + indicadores.length-1, r: 0} } ) );
			ws[ XLSX.utils.encode_cell({c: pos + 6, r: 0}) ] = {v: meses[i], t: 's'};
			for (var j = 0; j < indicadores.length; j++) {
				ws[ XLSX.utils.encode_cell({c: pos++, r: 1}) ] = {v: indicadores[j], t: 's'};
			}
		}

//		ws['!merges'] = coordenadasmerges;

		var dim = pos;
		for (i = 0; i < procedimientos.length; i++) {
			pos = 1;
			var procedimiento = procedimientos[i];

			ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: procedimiento.codigo, t: 's'};
			ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: procedimiento.denominacion, t: 's'};

			if ((typeof procedimiento.ancestros !== 'undefined') && (procedimiento.ancestros.length > 1)) {
				if (procedimiento.ancestros.length === 4) {
					for (j = 0; j < 3; j++) {

						ws[ XLSX.utils.encode_cell({c: pos, r: i + 2}) ] = {v: procedimiento.ancestros[j].id, t: 'n'};
						ws[ XLSX.utils.encode_cell({c: pos + 1, r: i + 2}) ] = {v: procedimiento.ancestros[j].nombrelargo, t: 's'};

						pos += 2;
					}
				} else if (procedimiento.ancestros.length === 3) {

					ws[ XLSX.utils.encode_cell({c: pos, r: i + 2}) ] = {v: procedimiento.ancestros[0].id, t: 'n'};
					ws[ XLSX.utils.encode_cell({c: pos + 1, r: i + 2}) ] = {v: procedimiento.ancestros[0].nombrelargo, t: 's'};
					ws[ XLSX.utils.encode_cell({c: pos + 4, r: i + 2}) ] = {v: procedimiento.ancestros[1].id, t: 'n'};
					ws[ XLSX.utils.encode_cell({c: pos + 5, r: i + 2}) ] = {v: procedimiento.ancestros[1].nombrelargo, t: 's'};

					pos += 6;
				} else if (procedimiento.ancestros.length === 2) {

					ws[ XLSX.utils.encode_cell({c: pos + 4, r: i + 2}) ] = {v: procedimiento.ancestros[0].id, t: 'n'};
					ws[ XLSX.utils.encode_cell({c: pos + 5, r: i + 2}) ] = {v: procedimiento.ancestros[0].nombrelargo, t: 's'};
					pos += 6;
				}
			} else {
				pos += 6;
			}

			ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: procedimiento.cod_plaza, t: 's'};

			var persona = procedimiento.cod_plaza !== null && procedimiento.cod_plaza !== '' ? personasByCodPlaza[ procedimiento.cod_plaza ] : undefined;
			if (typeof persona === 'undefined') {
				ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: 'Persona no encontrada', t: 's'};
				pos += 3;
			} else {
				ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: persona.login, t: 's'};
				ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: persona.apellidos + ', ' + persona.nombre, t: 's'};
				ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: persona.login + '@carm.es', t: 's'};
				ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: persona.telefono, t: 's'};
			}

			ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: ((typeof procedimiento.periodos[year].plazo_maximo_resolver === 'undefined' || procedimiento.periodos[year].plazo_maximo_resolver === null) ? '' : procedimiento.periodos[year].plazo_maximo_resolver), t: 'n'};
			ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: ((typeof procedimiento.periodos[year].plazo_maximo_responder === 'undefined' || procedimiento.periodos[year].plazo_maximo_responder === null) ? '' : procedimiento.periodos[year].plazo_maximo_responder), t: 'n'};
			ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: ((typeof procedimiento.periodos[year].plazo_CS_ANS_naturales === 'undefined' || procedimiento.periodos[year].plazo_CS_ANS_naturales === null) ? '' : procedimiento.periodos[year].plazo_CS_ANS_naturales), t: 'n'};
			ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: ((typeof procedimiento.periodos[year].plazo_CS_ANS_habiles === 'undefined' || procedimiento.periodos[year].plazo_CS_ANS_habiles === null) ? '' : procedimiento.periodos[year].plazo_CS_ANS_habiles), t: 'n'};
			ws[ XLSX.utils.encode_cell({c: pos++, r: i + 2}) ] = {v: ((typeof procedimiento.periodos[year].pendientes_iniciales === 'undefined' || procedimiento.periodos[year].pendientes_iniciales === null) ? '' : procedimiento.periodos[year].pendientes_iniciales), t: 'n'};
			for (var mes = 0; mes < meses.length; mes++) {
				if (typeof procedimiento.periodos[lastyearstr] !== 'undefined' && typeof procedimiento.periodos[lastyearstr].total_resueltos !== 'undefined') {
					ws[ XLSX.utils.encode_cell({c: pos, r: i + 2}) ] = {v: ((typeof procedimiento.periodos[lastyearstr].total_resueltos[mes] === 'undefined') ? '' : procedimiento.periodos[lastyearstr].total_resueltos[mes]), t: 'n'};
				}
				pos++;
			}
			for (var month = 0; month < meses.length; month++) {
				for (var ind = 0; ind < indicadoresDatabase.length; ind++) {
					if (typeof procedimiento.periodos[year][indicadoresDatabase[ind]] !== 'undefined') {
						ws[ XLSX.utils.encode_cell({c: pos, r: i + 2}) ] = {v: ((typeof procedimiento.periodos[year][indicadoresDatabase[ind]][month] === 'undefined') ? '' : procedimiento.periodos[year][indicadoresDatabase[ind]][month]), t: 'n'};
					}
					pos++;
				}
			}
		}

		var range = {s: {c: 0, r: 0}, e: {c: dim + 1, r: procedimientos.length + 1}};
		ws['!ref'] = XLSX.utils.encode_range(range);
		deferProc.resolve(ws);

		return deferProc.promise;
	};

	exports.download = function(app, cfg, fs, md5, path){
		return function (req, res) {
			var filename = req.params.token + (req.query.extension ? req.query.extension : '.xlsx'),
				ruta = app.get('prefixtmp'),
				rutaefectiva = path.resolve(ruta, filename);
			if (md5(cfg.downloadhashprefix + req.params.token) === req.params.hash) {
				fs.exists(ruta + filename, function (exists) {
					if (exists) {
						if (path.dirname(rutaefectiva) + path.sep === ruta) {
							res.download(ruta + filename, filename, function (err) {
								if (err) {
									logger.error(err);
								} else {
									logger.log('Fichero ' + ruta + filename + ' descargado');
									fs.unlink(ruta + filename, function (erro) {
										if (erro) {
											logger.error('No se ha podido borrar el fichero ' + ruta + filename);
										} else {
											logger.log('Fichero ' + ruta + filename + ' borrado');
										}
									});
								}
							});
						} else {
							logger.error('Acceso denegado:' + ruta + filename);
							res.status(404).send('Acceso denegado');
						}
					} else {
						logger.error('Fichero no válido' + ruta + filename);
						res.status(404).send('Fichero no válido');
					}
				});
			} else {
				res.status(404).send('Hash no válido');
			}
		};
	};

})(exports, console);
