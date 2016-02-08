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

	var replace = function(variables){
		return function(expresion){
			if (expresion.indexOf('/indicador') === 0){
				var valor,
					partes = expresion.split('/'),
					idIndicador = partes[2],
					indicador = variables[idIndicador],

					obj = indicador;
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
					if (typeof obj[ valor ] !== 'undefined'){
						obj = obj[ valor ];
					} else {
						return expresion;
					}
				}
				return obj;
			} else {
				return expresion;
			}
		};
	};

	Math.prototype.evalFormula = function(str, cb){
		var indicadormodel = this.models.indicador(),
			i, j, anualidad, idIndicador, partes;
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
			indicadoresACargar = {}, variables = {}, scope = {},
			resultado;

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
			}
		}

		var setIndicadoresACargar = function(promise, idIndicadorDb){
			return function(erro, indicador){
				if (erro){
					promise.reject(erro);
				} else if (!indicador){
					promise.reject({'error': 'Not found', idIndicador: idIndicadorDb});
				} else {
					indicadoresACargar[indicador._id] = indicador;
					promise.resolve(indicador);
				}
			};
		};
		for (idIndicador in indicadoresACargar){
			var defer = Q.defer();
			indicadormodel.findOne({_id: this.models.ObjectId(idIndicador)}, setIndicadoresACargar(defer, idIndicador));
			promises.push(defer.promise);
		}

		Q.all(promises).then(function(indicadores){
			if (modoAnualidad){
				//suponemos que ambos indicadores tienen las mismas anualidades
				variables = indicadoresACargar;
				for (idIndicador in indicadoresACargar){
					for (anualidad in indicadoresACargar[idIndicador].valores){
						returnValue[anualidad] = [];
						variables.anualidad = anualidad;
						for (var mes in indicadoresACargar[idIndicador].valores[anualidad]){
							variables.mes = mes;
							var formula = partes.map(replace(indicadoresACargar));
							var formulastr = formula.join('');
							scope = {
								entero: function(v){ parseFloat(v).toFixed(0); }
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
				}
			}
			cb(null, returnValue);
		}, function(err){
			cb(err);
		});
	};

	module.exports = Math;

})(module);

