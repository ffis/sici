(function(module, logger){
	'use strict';
	const Q = require('q'),
		Crawler = require('crawler'),
		Browser = require('zombie');

	function turnObjToArray(obj) {

		return [].map.call(obj, function(element) {

			return element;
		});
	}

	module.exports.importacionesprocedimiento = function(req, res){
		const importacionesmodels = req.metaenvironment.models.importacionesprocedimiento();
		//TODO: add check permisos
		const restriccion = {'mostrable': true, 'output.proceso': {'$in': req.user.permisoscalculados.procedimientosescritura}};
		importacionesmodels.find(restriccion, req.eh.cb(res));
	};

	module.exports.removeImportacionProcedimiento = function(req, res){

		if (typeof req.params._id === 'string' && req.params._id !== ''){
			const importacionesmodels = req.metaenvironment.models.importacionesprocedimiento();
			if (req.user.permisoscalculados.procedimientosescritura.indexOf(req.params._id) >= 0){
				const restriccion = {'_id': req.params._id, 'mostrable': true, 'output.proceso': {'$in': req.user.permisoscalculados.procedimientosescritura}};
				importacionesmodels.update(restriccion, {'$set': {mostrable: false}}, req.eh.cb(res));
			} else {
				req.eh.unauthorizedHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, '_id');
		}
	};

	module.exports.applyImportacionProcedimiento = function(req, res){
		if (typeof req.params.id === 'string' && req.params.id !== ''){

			const id = req.params.id;
			const models = req.metaenvironment.models,
				importacionesmodel = req.metaenvironment.models.importacionesprocedimiento(),
				procedimientomodel = req.metaenvironment.models.procedimiento(),
				recalculate = req.metaenvironment.recalculate,
				procedimientolib = req.metaenvironment.procedimiento;

			const restriccion = {'_id': models.objectId(id), 'mostrable': true};

			if (!req.user.permisoscalculados.superuser) {
				restriccion['output.proceso'] = {'$in': req.user.permisoscalculados.procedimientosescritura};
			}

			var fn = function(defer, val){
				return function(err){
					if (err){ defer.reject(err); } else { defer.resolve(val); }
				};
			};

			importacionesmodel.findOne(restriccion).exec().then(function(registro){

				if (!registro){
					req.eh.notFoundHelper(res);

					return;
				}

				//estructura cargada, tratar atributo
				//output: [{indicador:solicitados, proceso:1099, mes:01/6/2014, valor:0, fecha:04/09/2014, usuario:MLA25P},…]
				const actualizaciones = [];

				registro.output.forEach(function(linea){
					try {
						const codigo = linea.proceso,
							anualidad = linea.mes.split('/')[2],
							mes = parseInt(linea.mes.split('/')[1], 10) - 1,
							valor = linea.valor,
							indicador = linea.indicador;
						if (req.user.permisoscalculados.procedimientosescritura.indexOf(codigo) >= 0){
							const def = Q.defer();
							actualizaciones.push(def.promise);

							const campo = 'periodos.a' + anualidad + '.' + indicador + '.' + mes;
							const r = {'$set': {}};
							r.$set[campo] = valor;

							procedimientomodel.update({'codigo': String(codigo)}, r, fn(def, codigo));
						}
					} catch (exc) {
						logger.error(exc);
					}
				});

				Q.all(actualizaciones).then(function(valores){

					require('uniq')(valores);
					
					function fun(codigo, def){
						procedimientomodel.findOne({'codigo': String(codigo)}, function(erro, procedimiento){
							if (erro){
								def.reject(erro);
							} else if (procedimiento){
								recalculate.softCalculateProcedimiento(models, procedimiento).then(function(procedimient){
									recalculate.softCalculateProcedimientoCache(models, procedimient).then(function(proced){
										procedimientolib.saveVersion(models, proced).then(function(){
											proced.markModified('periodos');
											proced.save(def.makeNodeResolver());
										});
									});
								});
							} else {
								def.resolve();
							}
						});
					}

					const defers = [];
					valores.forEach(function(codigo){
						const def = Q.defer();
						defers.push(def.promise);
						fun(codigo, def);
					});
					Q.all(defers).then(function(){
						importacionesmodel.update(restriccion, {'$set': {'mostrable': false}}, req.eh.cb(res));
					}).fail(req.eh.errorHelper(res));
				});
			}).fail(req.eh.errorHelper(res));
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	module.exports.parseGS = function (req, res){
		if (typeof req.params.id === 'string' && parseInt(req.params.id, 10) > 0){
			const settings = req.metaenvironment.settings;
			const id = parseInt(req.params.id, 10);
			if (id > 0){
				const url = settings.urls.procedimiento + id;
				const browser = new Browser();

				browser.visit(url).then(function(){
					const datos = {};
					const campos = browser.querySelectorAll('.campoProcedimiento');
					const lista = turnObjToArray(campos);
					lista.forEach(function(detalle){
						const campo = detalle.childNodes && detalle.childNodes.length > 0 ? detalle.childNodes.item(0).textContent.trim() : detalle.textContent.trim();
						const valorDiv = detalle.nextSibling;
						const parent = valorDiv.parentNode;
						const valor = typeof parent.innerHTML === 'string' ? parent.innerHTML.trim() : false;
						if (campo && campo !== '' && valor && valor !== ''){
							datos[campo] = valor;
						}
					});
					res.json(datos);

				}, req.eh.errorHelper(res));
			} else {
				req.eh.notFoundHelper(res);
			}
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

	function cbParseCr(defer, id) {
		return function(error, result, $) {
			if (error){
				defer.reject(error);

				return;
			}
			const datos = {};

			$('.campoProcedimiento').each(function(indx, campoProcedimiento) {
				let campo = $(campoProcedimiento).text();
				campo = campo.replace('.', '_');
				datos[campo] = $(campoProcedimiento).next().text();
			});
			const jerarquia = [];
			$('#primeraFilaProc li').each(function(idx, n){
				const t = $(n).text().trim().split("\n")[0];
				if (t){
					//t = encoding.convert(t, 'utf-8', 'utf-8');
					jerarquia.push(t);
				}
			});

			const completo = $('.procedimiento').text();
			defer.resolve({id: id, any: datos, jerarquia: jerarquia, completo: completo});
		};
	}

	module.exports.parseCr = function (req, res){

		if (typeof req.params.id === 'string' && parseInt(req.params.id, 10) > 0){

			const settings = req.metaenvironment.settings;
			const id = parseInt(req.params.id, 10);
			const url = settings.urls.procedimiento + id;
			const crawledmodel = req.metaenvironment.models.crawled();
			const restriccion = {'id': id, jerarquia: {'$exists': true}, expires: {'$gt': new Date()}};

			crawledmodel.findOne(restriccion).lean().exec().then(function(data){

				if (data){
					res.json(data);
				} else {
					const deferred = Q.defer(),
						c = new Crawler({'maxConnections': 10, 'callback': cbParseCr(deferred, id), userAgent: settings.userAgent});
					c.queue(url);
					deferred.promise.then(function(v){
						if (Array.isArray(v.jerarquia) && v.jerarquia.length > 0){
							const expiresDate = new Date();
							expiresDate.setDate(expiresDate.getDate() + 1);
							v.expires = expiresDate;
							crawledmodel.update({'id': id}, v, {upsert: true});
						}
						res.json(v.any);
					}, req.eh.errorHelper(res));
				}
			});
		} else {
			req.eh.missingParameterHelper(res, 'id');
		}
	};

})(module, console);
