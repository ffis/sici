(function(module){
	'use strict';
	var math = require('mathjs'),
		Q = require('q');

	function Math(modelss){
		this.models = modelss;
	}
	Math.prototype.eval = function(expr){
		return math.eval(expr);
	};

	var extractValue = function(partes, expresion, variables, obj){
		var valor;
		for (var i = 3, j = partes.length; i < j; i++){
			if (partes[i].indexOf('[') === 0 && partes[i].indexOf(']') === partes[i].length - 1 ){
				//se busca el valor en el diccionario de variables
				var nombrevariable = partes[i].substr(1, partes[i].length - 2);
				if (typeof variables[nombrevariable] !== 'undefined'){
					valor = variables[nombrevariable];
				} else {
					console.error('No existe la variable:' + nombrevariable);
					valor = partes[i];
				}
			} else {
				valor = partes[i];
			}
			if (valor === '12' && typeof obj[ valor ] === 'undefined' && typeof obj === 'object'){
				//caso especial procedimiento, debe ser la suma de los anteriores
				return obj.reduce(function(p, o){
					if (!o){
						return p;
					}
					return p + o;
				});
			}
			if (typeof obj[ valor ] !== 'undefined'){
				obj = obj[ valor ];
			} else {
				return expresion;
			}
		}
		return obj;
	};

	var replace = function(variables){
		return function(expresion){
			var partes,
				idIndicador, idProcedimiento,
				indicador, procedimiento /*, campo*/;

			if (expresion.indexOf('/') === 0 && expresion.trim() !== '/'){
				partes = expresion.split('/');
			}

			if (expresion.indexOf('/indicador') === 0){
				idIndicador = partes[2];
				indicador = variables[idIndicador];

				return extractValue(partes, expresion, variables, indicador);
			} else if (expresion.indexOf('/procedimiento') === 0){
				/* /procedimiento/_id/periodos/[anualidad]/atributo/[mes] */
				idProcedimiento = partes[2];
				procedimiento = variables[idProcedimiento];
//				campo = partes[5];
//				console.log(expresion, variables, procedimiento, campo);

				return extractValue(partes, expresion, variables, procedimiento);

			} else {
				return expresion;
			}
		};
	};

	Math.prototype.evalFormula = function(str, cb){
		var indicadormodel = this.models.indicador(),
			procedimientomodel = this.models.procedimiento(),
			i, j, anualidad, idIndicador, idProcedimiento, partes;
		try {
			partes = JSON.parse(str);
		} catch (err){
			cb(err);
			return;
		}
		var	returnValue = {},
			modoAnualidad = false,
			modoMes = false,
			promises = [], tokens = [],
			indicadoresACargar = {}, procedimientosACargar = {}, variables = {}, scope = {},
			resultado, defer;

		for (i = 0, j = partes.length; i < j; i++){
			if (partes[i].indexOf('[anualidad]') > -1){
				modoAnualidad = true;
			}
			if (partes[i].indexOf('[mes]') > -1){
				modoMes = true;
			}
		}

		for (i = 0, j = partes.length; i < j; i++){
			if (partes[i].indexOf('/indicador') === 0){
				tokens = partes[i].split('/');
				idIndicador = tokens[2].trim();
				if (idIndicador.length === 24 || idIndicador.length === 12){
					indicadoresACargar[idIndicador] = false;
				} else {
					cb({error: '_id mal formado:' + idIndicador});
				}
			}else if (partes[i].indexOf('/procedimiento') === 0){
				tokens = partes[i].split('/'),
				idProcedimiento = tokens[2].trim();
				if (idProcedimiento.length === 24 || idProcedimiento.length === 12){
					procedimientosACargar[idProcedimiento] = false;
				} else {
					cb({error: '_id mal formado:' + idProcedimiento});
				}
			}
		}

		var setACargar = function(promise, id, collection){
			return function(erro, obj){
				if (erro){
					promise.reject(erro);
				} else if (!obj){
					promise.reject({'error': 'Not found', _id: id});
				} else {
					collection[obj._id] = obj;
					promise.resolve(obj);
				}
			};
		};
		for (idIndicador in indicadoresACargar){
			defer = Q.defer();
			indicadormodel.findOne({_id: this.models.ObjectId(idIndicador)}, setACargar(defer, idIndicador, variables));
			promises.push(defer.promise);
		}
		for (idProcedimiento in procedimientosACargar){
			defer = Q.defer();
			procedimientomodel.findOne({_id: this.models.ObjectId(idProcedimiento)}, setACargar(defer, idProcedimiento, variables));
			promises.push(defer.promise);
		}


		Q.all(promises).then(function(){
			if (modoAnualidad){
				var entero = function(v){ parseFloat(v).toFixed(0); };
				//suponemos que ambos indicadores tienen las mismas anualidades
				var vars = JSON.parse(JSON.stringify(variables));
				for (idIndicador in variables){
					if (typeof variables[idIndicador].valores === 'undefined'){
						continue;
					}
					for (anualidad in variables[idIndicador].valores){
						returnValue[anualidad] = [];
						vars.anualidad = anualidad;
						for (var mes in variables[idIndicador].valores[anualidad]){
							vars.mes = mes;
							var formula = partes.map(replace(vars));
							var formulastr = formula.join('');
							scope = {
								entero: entero
							};
							resultado = 0;
							try {
								if (formula.filter(function(a){ return a === null; }).length === 0){
									resultado = math.parse(formulastr).compile().eval(scope);
								} else {
									resultado = null;
								}
							} catch (e) {
								console.error(118, e);
							}
							returnValue[anualidad].push({formula: formula, resultado: resultado});
						}
					}
					break;
				}
			}
			cb(null, returnValue);
		}, function(err){
			cb(err);
		});
	};

	module.exports = Math;

})(module);

