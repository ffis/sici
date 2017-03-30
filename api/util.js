(function(module, log){
	/** @module api */
	'use strict';
	const Q = require('q');

	let cachedArbol = {};
	let hijos = [];
	let idsraiz = [];
	let mappingXid = [];

	/**
	 * Log de actividad. Helper para expressjs. Registra el usuario que realiza la petición, la fecha, la url, las cabeceras de la petición así como el cuerpo de la misma. El almacenamiento se realiza en un objeto del modelo Registroactividad.
	 * @param {object} req - expressjs request like
	 * @param {object} res - expressjs response like
	 * @param {function} next - expressjs next callback like
	 */
	module.exports.log = function(req, res, next){
		const registroactividad = req.metaenvironment.models.registroactividad(),
			data = {
				usr: req.user.login,
				fecha: new Date(),
				url: req.url,
				req: {
					headers: req.headers,
					body: req.body
				}
			};
		registroactividad.create(data);
		next();
	};

	/**
	 * Estructura de árbol para seleccionar entidades
	 * @param {boolean} withemptynodes - Si es verdadero muestra todos los nodos. Por defecto es falso.
	 * @returns {Array} Un array de objetos con esta estructura
     * { _id: number, id: number, title: string, nodes: [], numprocedimientos: number, numcartas: number}
	 */
	function resetCache(){
		cachedArbol = {};
		hijos = [];
		idsraiz = [];
		mappingXid = [];
	}

	function getHijos(idjerarquia, filterfn){
		let collection = hijos[idjerarquia];
		if (!collection){
			return null;
		}

		if (typeof filterfn === 'function'){
			collection = collection.filter(filterfn);
		}

		return collection.map(function(nodo){
			return ({
				_id: nodo._id,
				id: nodo.id,
				title: nodo.nombrelargo,
				nodes: getHijos(nodo.id, filterfn),
				numprocedimientos: nodo.numprocedimientos,
				numcartas: nodo.numcartas
			});
		});
	}

	module.exports.getAncestros = function(idjerarquia){
		return mappingXid[idjerarquia].ancestros.map(function(id){ return mappingXid[id]; });
	};

	module.exports.getJerarquiaById = function(idjerarquia){
		return mappingXid[idjerarquia];
	};

	function calculateArbol(models){
		const deferred = Q.defer();
		resetCache();

		models.jerarquia().find({}, function(err, jerarquias){
			if (err){
				deferred.reject(err);

				return;
			}

			jerarquias.forEach(function(jerarquia){
				mappingXid[jerarquia.id] = jerarquia;
				if (jerarquia.ancestros.length === 0){
					idsraiz.push(jerarquia.id);
				} else if (jerarquia.ancestrodirecto){
					if (!hijos[jerarquia.ancestrodirecto]){
						hijos[jerarquia.ancestrodirecto] = [];
					}
					hijos[jerarquia.ancestrodirecto].push(jerarquia);
				}
			});

			deferred.resolve();
		});

		return deferred.promise;
	}

	function answer(res, cachedkey, filterfn){
		const fn = (filterfn) ? filterfn : function(){ return true; };

		cachedArbol[cachedkey] = idsraiz.map(function(idraiz){
			return mappingXid[idraiz];
		}).filter(fn).map(function(nodo){
			return {
				_id: nodo._id,
				id: nodo.id,
				title: nodo.nombrelargo,
				nodes: getHijos(nodo.id, filterfn),
				numprocedimientos: nodo.numprocedimientos,
				numcartas: nodo.numcartas
			};
		});
		res.json(cachedArbol[cachedkey]);
	}

	module.exports.arbol = function(req, res){
		const cachedkey = (typeof req.params.withemptynodes === 'undefined' || !req.params.withemptynodes) ? 'all' : 'notempty';
		let filterfn = false;
		if (typeof req.params.withemptynodes === 'undefined' || !req.params.withemptynodes){

			filterfn = function(jerarquia){
				if (jerarquia.numprocedimientos > 0){
					return true;
				}
				if (jerarquia.numcartas > 0){
					return true;
				}
				if (!hijos[jerarquia.id]){
					return false;
				}

				return hijos[jerarquia.id].some(filterfn);
			};
		}
		if (typeof cachedArbol[cachedkey] === 'object'){
			res.json(cachedArbol[cachedkey]);

			return;
		}

		if (hijos.length === 0){
			calculateArbol(req.metaenvironment.models).then(function(){
				answer(res, cachedkey, filterfn);
			}, req.eh.errorHelper(res));
		} else {
			answer(res, cachedkey, filterfn);
		}
	};

	module.exports.raw = function(req, res){
		const models = req.metaenvironment.models;

		const modelname = req.params.modelname;
		const fields = req.query.fields;
		const permitidas = ['reglasinconsistencias', 'crawled'];
		
		if (typeof models[modelname] !== 'function' || permitidas.indexOf(modelname) === -1){
			const message = modelname + ' doesn\'t exists in model';
			log.error(message);
			res.status(500).json({err: message});

			return;
		}
		const loader = models[modelname]();
		const restricciones = {
			'oculto': {'$ne': true},
			'eliminado': {'$ne': true}
		};
		if (modelname === 'crawled'){
			restricciones.id = {'$in': req.user.permisoscalculados.procedimientoslectura.concat(req.user.permisoscalculados.procedimientosescritura)};
		}

		const query = loader.find(restricciones);

		if (typeof fields !== 'undefined'){
			query.select(fields);
		}
		query.exec(req.eh.cb(res));
	};

	module.exports.aggregate = function(req, res){
		const cfg = req.metaenvironment.cfg,
			models = req.metaenvironment.models;

		const procedimientomodel = models.procedimiento();
		const campostr = req.params.campo;
		const anualidad = req.params.anualidad ? parseInt(req.params.anualidad, 10) : cfg.anyo;
		const group = [];
		const groupfield = {};

		try {
			groupfield._id = JSON.parse(campostr);
		} catch (e) {
			groupfield._id = '$' + campostr;
		}

		let match = {};
		const jerarquia = req.user.permisoscalculados.superuser ? false : {'idjerarquia': {'$in': req.user.permisoscalculados.jerarquialectura.concat(req.user.permisoscalculados.jerarquiaescritura)}};
		const oculto = {
			'$or': [
				{'oculto': {$exists: false}},
				{
					'$and': [
						{'oculto': {$exists: true}},
						{'oculto': false}
					]
				}
			]
		};
		const eliminado = {
			'$or': [
				{'eliminado': {$exists: false}},
				{
					'$and': [
						{'eliminado': {$exists: true}},
						{'eliminado': false}
					]
				}
			]
		};
		const blancos = {};
		blancos[campostr] = {$ne: ''};
		const matchstr = req.params.match;
		if (typeof matchstr === 'string'){
			try {
				match = JSON.parse(matchstr);
			} catch (e) {
				const condiciones = matchstr.split('|');
				condiciones.forEach(function(condicion){
					const partes = condicion.split(':');
					const campomatch = partes[0];
					let valor = typeof partes[1] === 'undefined' ? '' : partes[1];
					if (/^(-|\+)?([0-9]+|Infinity)$/.test(valor)){
						valor = parseInt(valor, 10);
					}
					match[campomatch] = valor;
				});
			}
			match = {'$and': [match, blancos, jerarquia, oculto, eliminado].filter((a) => a)};
		} else {
			match = {'$and': [blancos, jerarquia, oculto, eliminado].filter((a) => a)};
		}
		group.push({'$match': match});
		groupfield.count = {'$sum': 1};
		groupfield.porcumplimentar = {'$sum': {'$cond': [{'$eq': [0, '$periodos.a' + anualidad + '.totalsolicitudes']}, 1, 0]}};

		/*group.push({'$unwind':'$ancestros'});*/
		group.push({'$group': groupfield});
		group.push({'$sort': {'count': -1}});
		//console.log(JSON.stringify(group));
		procedimientomodel.aggregate(group, req.eh.cb(res));
	};


	module.exports.resetCache = resetCache;
	module.exports.calculateArbol = calculateArbol;
	module.exports.getHijos = getHijos;

})(module, console);
