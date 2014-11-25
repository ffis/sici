// JavaScript Document
/*var Crawler = require("crawler").Crawler;
var Browser = require("zombie");*/
var encoding  = require("encoding");
var util = require('util');
var XLSX = require('xlsx');

function parseStr2Int (str){
	var valor = parseInt(str);
	if(isNaN(valor)) valor=0;
	return valor;
}

var turnObjToArray = function(obj) {
  return [].map.call(obj, function(element) {
    return element;
  })
};

exports.importacionesprocedimiento = function(models){
	return function(req,res){
		var Importaciones = models.importacionesprocedimiento();
		//add check permisos
		var restriccion = {mostrable: true, 'output.proceso': { '$in': req.user.permisoscalculados.procedimientosescritura }};
		Importaciones.find(restriccion, function(err,datos){
			if (err){
				console.error(err);
				res.status(500).send(JSON.stringify(err));
			}else{
				res.json(datos);		
			}
		});
	}
}

exports.removeImportacionProcedimiento = function(models){
	return function(req,res){
		var Importaciones = models.importacionesprocedimiento();
		var _id = req.params._id;
		if (!_id){
			res.status(400).send('Carece de permisos');
			return;
		}

		var restriccion = {_id: _id, mostrable: true, 'output.proceso': { '$in': req.user.permisoscalculados.procedimientosescritura }};

		Importaciones.update(restriccion, {$set: {mostrable: false}}, function(err,datos){
			if (err){
				console.error(err);
				res.status(500).send(JSON.stringify(err));
			}else{
				res.json(datos);		
			}
		});
	}
}
exports.applyImportacionProcedimiento = function(models, Q, recalculate, P){
	return function(req,res){
		var Importaciones = models.importacionesprocedimiento();
		var Procedimiento = models.procedimiento();
		var _id = req.params._id;
		if (!_id){
			res.status(400).send('Carece de permisos');
			return;
		}
		var restriccion = {_id: _id, mostrable: true, 'output.proceso': { '$in': req.user.permisoscalculados.procedimientosescritura }};
		Importaciones.find(restriccion, function(err,datos){
			if (err){
				console.error(err);
				res.status(500).send(JSON.stringify(err));
			}else{
				//estructura cargada, tratar atributo
				//output: [{indicador:solicitados, proceso:1099, mes:01/6/2014, valor:0, fecha:04/09/2014, usuario:MLA25P},…]
				var defs = [];
				datos.forEach(function(registro){
					registro.output.forEach(function(linea){
						try{
							var codigo = linea.proceso,
								anualidad = linea.mes.split('/')[2],
								mes = parseInt(linea.mes.split('/')[1])-1,
								valor = linea.valor,
								indicador = linea.indicador;
							if (req.user.permisoscalculados.procedimientosescritura.indexOf(codigo)!=-1){
								var def = Q.defer();
								defs.push(def.promise);
								var fn = function(codigo,restriccion, def){
									Procedimiento.update({codigo:codigo}, restriccion,
										function(err){
											if (err) console.error(err);
											def.resolve(codigo);
									});
								}
								var campo = 'periodos.a'+anualidad+'.'+indicador+'.'+mes;
								var r = {}; r['$set'] = {}; r['$set'][campo] = valor;

								fn(codigo, r, def);
							}
						}catch(exc){
							console.error(exc)
						}
					})
				})
				Q.all(defs).then(function(valores){

					valores = valores.filter(function(item, pos, self) {
					    return self.indexOf(item) == pos;
					});

					defs = [];
					valores.forEach(function(codigo){
						var def = Q.defer();
						defs.push(def.promise);
						var fn = function(codigo,def){
							Procedimiento.findOne({codigo:codigo}, function(err,procedimiento){
								recalculate.softCalculateProcedimiento(Q, models, procedimiento).then(function(procedimiento){
									recalculate.softCalculateProcedimientoCache(Q, models, procedimiento).then(function(procedimiento){
										P.saveVersion(models, Q, procedimiento).then(function(){
											def.resolve();
										})
									})
								})
							})
						}
						fn(codigo,def);
					})
					Q.all(defs).then(function(valores){
						Importaciones.update(restriccion, {$set: {mostrable: false}}, function(err,datos){
							res.json(datos[0]);
						});
					});
				});
			}
		});
	}
}


exports.parseGS = function(){
	return function (req, res)
	{/*
			var id = parseInt(req.params.id);
			var url = "http://www.carm.es/web/pagina?IDTIPO=240&IDCONTENIDO="+id;
			var browser = new Browser();

			browser.visit(url).then(function() {
				var datos = {};
				var campos = browser.querySelectorAll('.campoProcedimiento');
				var lista = turnObjToArray(campos);
				lista.forEach(function(detalle){
					var campo = detalle.childNodes && detalle.childNodes.length>0 ? detalle.childNodes.item(0).textContent : detalle.textContent;
					var valorDiv = detalle.nextSibling;
					console.log(typeof detalle.nextSibling);
					
					var parent = valorDiv.parentNode;
					var valor = typeof parent.innerHTML == 'string' ? parent.innerHTML : typeof parent.innerHTML;
					
					datos[campo] = valor;
				});

				res.json(datos);			

			})
			/*
			.fail(function(e,b){
				res.json(b);
			});*/

	}
}

exports.parseCr = function(Q,models){
	return function (req, res)
	{/*
		var id = parseInt(req.params.id);
		var url = "http://www.carm.es/web/pagina?IDTIPO=240&IDCONTENIDO="+id;
		var Crawled = models.crawled();		
		var restriccion = {id:id, jerarquia: { '$exists': true}};
			
		Crawled.find(restriccion,function(err,data){
		if (err){
			console.error(err);
		}
		if (true){
		
			var deferred = Q.defer();
		
			var cb = function(df) {
				return function(error,result,$) {
				
					if (error){
						res.json ({});
						return;
					}
					var datos = {};
				
					$(".campoProcedimiento").each(function(index,campoProcedimiento) {
						  var campo = $(campoProcedimiento).text();
						  campo = campo.replace('.','_');
						  datos[campo] = $(campoProcedimiento).next().text();
					});
					var jerarquia = [];
					$("#primeraFilaProc li").each(function(i,n){
						var t = $(n).text().trim().split("\n")[0]; if (t){
							t =  encoding.convert(t, 'utf-8', 'utf-8');
							jerarquia.push(t);
						}
					});

					var completo = $('.procedimiento').text();

					var Crawled = models.crawled();
					Crawled.update({id:id}, { id:id, any:datos, jerarquia : jerarquia, completo:completo}, { upsert: true }, function(e){
							if (e){
								console.error(e);
							}
						});
				
					df.resolve(datos);
				}
			};

			var c = new Crawler({"maxConnections":10, "callback": cb(deferred) });
			c.queue(url);
			deferred.promise.then(function (v){
				res.json(v);
			});
		}else{
			res.json(data);
		}
		});*/
	}
}


exports.parseExcel = function (path, worksheetName, maxrows)
{
	var turnObjToArray = function(obj) {
	  return [].map.call(obj, function(element) {
	    return element;
	  })
	};

	
	var workbook   = XLSX.readFile(path);
	var worksheet  = workbook.Sheets[worksheetName];
	var cabecera   = [];
	var fields     = { lista:[], tipos:{}};
	var objetos    = [];
	var jerarquias = [];

	for(var fila=2;fila<maxrows;fila++)
	{
		if (fila==2)
		{
			//cabecera
			for(var columna=1;columna<55550;columna++)
			{
				var n = getColumn(columna);
				if (n=='HP') break;
				var idx = getColumn(columna)+fila;
				var campo = typeof worksheet[idx] ==='undefined' ?'' : worksheet[idx].v.trim()
					.replace('.','_').replace('.','_').replace('.','_')
					.replace('Ó','O').replace('ó','o')
					.replace('í','i').replace('Í','I')
					.replace('á','a').replace('á','a')
					.replace('á','a').replace('é','e')
					;

				if (campo=='') break;
				fields.lista.push(campo);
				fields.tipos[campo] = (typeof fields.tipos[campo] != 'undefined') ?  'array': 'object';
			}
		}else{

			var objeto = {};

			for(var columna = 1,maxcolumna = fields.lista.length; columna<maxcolumna; columna++) {
				var n = getColumn(columna);
				if (n=='HP') break;
				var idx = getColumn(columna)+fila;
				var valor = typeof worksheet[idx] ==='undefined' ? {t:'',v:''} : worksheet[idx];

				if (valor.t=='s'){
					valor.v = valor.v.replace("\\r\\n","");
				}
				
				var campo = fields.lista[columna-1];
				var tipo = fields.tipos[campo];
				
				if (tipo==='array'){
					valor.v = parseStr2Int(valor.v);
				}

				if (typeof objeto[campo] === 'undefined')
				{
					if (tipo=='array' || tipo=='object')
						objeto[campo] = (tipo==='array' ? [valor.v]: valor.v);
				}else{		
					if (!Array.isArray(objeto[campo])) {
						console.error(campo+" deberia ser un array");
						continue;
					}
					objeto[campo].push(valor.v);
				}
			}

			objeto = transformExcel2Procedimiento(objeto);
			if (!objeto) break;
			objetos.push(objeto);
		}
	}
	return objetos;
}

exports.postParseExcel = function(Q, models, procedimientos, recalculate){
	var response = Q.defer();
	var defs = [];
	var procs = [];
	procedimientos.forEach(function(procedimiento, i){
		var q = Q.defer();
		recalculate.softCalculateProcedimiento(Q, models, procedimiento).then(function(procedimiento){
			recalculate.softCalculateProcedimientoCache(Q, models, procedimiento).then(function(procedimiento){
				procs.push(procedimiento);
				q.resolve(procedimiento);
			}).fail(function(err){
				q.fail(err);
			})
		})
		defs.push(q.promise);
	})

	Q.all(defs).then(function(){
		response.resolve(procs);
	}).fail(function(err){
		response.fail(err);
	});
	return response.promise;
}


function parseStr2Int (str){
	var valor = parseInt(str);
	if(isNaN(valor)) valor=0;
	return valor;
}

function getColumn(x){
	return mapping[x];
}

function transformExcel2Procedimiento(objeto){

	var nuevomapping = {
		'codigo' : 'CODIGO',
		'denominacion': 'DENOMINACION DEL PROCEDIMIENTO',
		'cod_plaza' : 'Codigo plaza responsable',
		'idjerarquia' : 'Codigo Nivel 3'
	};
	var mappinganyo = {
		'plazo_CS_ANS_naturales':'Plazo CS /ANS (dias naturales)',
		'plazo_CS_ANS_habiles':'Plazo CS /ANS (dias habiles)',	
		'plazo_maximo_responder': 'Plazo maximo legal para responder (dias habiles)',
		'plazo_maximo_resolver' : 'Plazo maximo legal para resolver (dias naturales)',
		'solicitados' : 'Solicitados',
		'pendientes_iniciales':'Pendientes iniciales (a 31-12)',
		'solicitados':'Solicitados',
		'iniciados': 'Iniciados',
		'resueltos_1':'Resueltos [1]',
		'resueltos_5':'Resueltos [5]',				
		'resueltos_10':'Resueltos [10]',
		'resueltos_15':'Resueltos [15]',
		'resueltos_30':'Resueltos [30]',
		'resueltos_45':'Resueltos [45]',
		'resueltos_mas_45':'Resueltos [>45]',
		'resueltos_desistimiento_renuncia_caducidad':'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)',
		'resueltos_prescripcion':'Resueltos por Prescripcion/Caducidad (Resp_Admon)',
		't_medio_naturales':'T_ medio dias naturales',
		't_medio_habiles':'T_ medio dias habiles descontando T_ de suspensiones',
		'en_plazo':'En plazo',
		'quejas':'Quejas presentadas en el mes',
		'recursos': 'Recursos presentados en el mes',
	};
	var eliminar = [
		'Enero','Febrero','Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
		"Codigo Nivel 1", "Denominacion Nivel 1", "Codigo Nivel 2", "Denominacion Nivel 2",	"Denominacion Nivel 3",
		"Login responsable", "Nombre responsable", "Correo-e responsable","Telefono responsable"
	];


	if (!objeto['CODIGO']) return false;

	if (!objeto.periodos)
		objeto.periodos = {};
	objeto.periodos['a2013'] = {
		plazo_maximo_resolver : (objeto['Plazo maximo legal para resolver (dias naturales)']),
		plazo_maximo_responder : (objeto['Plazo maximo legal para responder (dias habiles)']),
		plazo_CS_ANS_naturales : (objeto['Plazo CS /ANS (dias naturales)']),
		pendientes_iniciales : 0,
		total_resueltos : [
			parseStr2Int(objeto['Enero']),
			parseStr2Int(objeto['Febrero']),
			parseStr2Int(objeto['Marzo']),
			parseStr2Int(objeto['Abril']),
			parseStr2Int(objeto['Mayo']),
			parseStr2Int(objeto['Junio']),
			parseStr2Int(objeto['Julio']),
			parseStr2Int(objeto['Agosto']),
			parseStr2Int(objeto['Septiembre']),
			parseStr2Int(objeto['Octubre']),
			parseStr2Int(objeto['Noviembre']),
			parseStr2Int(objeto['Diciembre']),
		]
	};

	for(var campo in nuevomapping){
		objeto[campo] = objeto[ nuevomapping [ campo] ];
		delete  objeto[ nuevomapping [ campo] ];
	}
	if (!objeto.periodos['a2014']) objeto.periodos['a2014'] = {};
	for(var campo in mappinganyo){
		objeto.periodos['a2014'][campo] = objeto[ mappinganyo [ campo ] ];
		delete  objeto[ mappinganyo [ campo ] ];	
	}

	eliminar.forEach(function(campo){
		delete objeto[campo];
	});

	objeto.idjerarquia = parseInt(objeto.idjerarquia);
	return objeto;
}

exports.testImportadorExcel = function(Q,models, recalculate){
	return function(req, res){
		var path = '../1.xlsm';
		var worksheetName = 'BD';
		var maxrows = 50;

		var procedimientos = exports.parseExcel(path, worksheetName, maxrows);
		exports.postParseExcel(Q, models, procedimientos, recalculate).then
		(function(procedimientos){
			res.json(procedimientos);
		});
		
	}
}


	/* mapping for using XY coordinates on excel */
	var mapping = [];
	var index=0;
	for (var i ='A'.charCodeAt(0),j='Z'.charCodeAt(0); i<=j;i++){
		mapping.push(String.fromCharCode(i));
		index++;
	}

	for (var prefixi ='A'.charCodeAt(0),prefixj='Z'.charCodeAt(0); prefixi<=prefixj;prefixi++){
		for (var i ='A'.charCodeAt(0),j='Z'.charCodeAt(0); i<=j;i++){
			mapping.push(String.fromCharCode(prefixi) + String.fromCharCode(i));
			index++;
		}
	}
	for (var prefix ='A'.charCodeAt(0),prefixk='Z'.charCodeAt(0); prefix<=prefixk;prefix++){
		for (var prefixi ='A'.charCodeAt(0),prefixj='Z'.charCodeAt(0); prefixi<=prefixj;prefixi++){
			for (var i ='A'.charCodeAt(0),j='Z'.charCodeAt(0); i<=j;i++){
				mapping.push( String.fromCharCode(prefix) +String.fromCharCode(prefixi) + String.fromCharCode(i) );
				index++;
			}
		}
	}
