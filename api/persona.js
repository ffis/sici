
exports.personasByPuesto = function(models){
	return function(req,res){
		var Persona = models.persona();
		var restriccion = {};
		if (typeof req.params.cod_plaza !== 'undefined')
			restriccion.codplaza = req.params.cod_plaza;
		Persona.find(restriccion,function(err,data){
			if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }
			res.json (data);
		});
	};
};

exports.personasByLogin = function(models){
	return function(req,res){
		var Persona = models.persona();
		var restriccion = {};
		if (typeof req.params.login !== 'undefined')
			restriccion.login = req.params.login;
		Persona.find(restriccion,function(err,data){
			if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }
			res.json (data);			
		});
	};
};

exports.updatePersona = function(models){
	return function(req, res) {
		var Persona = models.persona();
	    var id = req.params.id;

	    var content = req.body;
	    Persona.update({'_id':id}, content, { upsert: true }, function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}

exports.newPersona = function(models){
	return function(req, res) {
		var Persona = models.persona();
	    var content = req.body;
	    new Persona(content).save( function(e){
			if (e){
				 res.send({'error':'An error has occurred'});
			}else{
				res.send(content);
			}
		});
	}
}

exports.personasByRegex = function(models){
	return function(req,res){
		var Persona = models.persona();
		var restriccion = {};
		if (typeof req.params.regex !== 'undefined'){
			restriccion = {
				"$or" : [
					{
					"login": {
					"$regex" : "^"+req.params.regex+"",
					"$options" : "i"
					}},
					{
					"codplaza": {
					"$regex" : "^"+req.params.regex+"",
					"$options" : "i"
					}},					
					{
					"nombre": {
					"$regex" : "^"+req.params.regex+"",
					"$options" : "i"
					}},
					{
					"apellidos": {
					"$regex" : "^"+req.params.regex+"",
					"$options" : "i"
					}}
				]
			}
			Persona.find(restriccion,function(err,data){
				if (err) { console.error(restriccion); console.error(err); res.status(500); res.end(); return ; }
				res.json (data);
			});
		} else {
			res.status(500); res.end(); return ;
		}
	};
};


function transformExcel2Persona(objeto,  models,Q){

	var Persona = models.persona();
	var persona = {
		'codplaza':objeto.puesto.trim(),
		'login':objeto.login.trim(),
		'nombre':objeto.nombre.trim(),
		'apellidos':objeto.apellido1 + ' ' + objeto.apellido2,
		'habilitado':false,
	};

	var dpersonaresultado = Q.defer();
	var ppersonaresultado = dpersonaresultado.promise;
	
	var informeresultado = {
		actualizado : true,
		persona : ppersonaresultado
	};
		
	Persona.find({'login':persona.login},function(err,personas){
		if (err) { dpersonaresultado.reject(err); }
		else {			
			if (personas.length>0) {
				informeresultado.actualizado=true;								
				personas[0].login=persona.login;
				personas[0].codplaza = persona.codplaza;
				personas[0].nombre = persona.nombre;
				personas[0].apellidos = persona.apellidos;
				dpersonaresultado.resolve(personas[0]);								
			} else {
				informeresultado.actualizado=false;
				var p = new Persona(persona);
				dpersonaresultado.resolve(p);	
			}
		}
	});
	
	return informeresultado;
}

var XLSX = require('xlsx');

function parseExcelGesper(path,worksheetName,maxrows,models,Q){
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

	var procesados = 0;
	
	for(var fila=1;fila<maxrows;fila++)
	{
		if (fila==1)
		{
			//cabecera
			for(var columna=0;columna<55550;columna++)
			{
				var n = getColumn(columna);
				if (n=='H') break;
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

			for(var columna = 0,maxcolumna = fields.lista.length; columna<maxcolumna; columna++) {
				var n = getColumn(columna);
				if (n=='H') break;
				var idx = getColumn(columna)+fila;
				var valor = typeof worksheet[idx] ==='undefined' ? {t:'',v:''} : worksheet[idx];

				if (valor.t=='s'){
					valor.v = valor.v.replace("\\r\\n","");
				}
				
				var campo = fields.lista[columna];
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

			if (objeto['login'] || objeto['puesto']) {	
				procesados++;
				objeto = transformExcel2Persona(objeto, models,Q);
				if (!objeto) break;
				objetos.push(objeto);			
			}
		}
	}
	console.log(fields);
	return objetos;
}

exports.importarGesper = function(models,Q) {
	return function(req, res) {
		var path = 'e:\\temp\\basura\\universo.xlsx';
		//var path = '../universo.xlsx';
		var hoja = 'salida1';
		var maxrows = 10000;
		
		var Persona = models.persona();
		var operacionesGesper = parseExcelGesper(path,hoja,maxrows,models,Q);		
		var promesas = [];
		var resultado = [];

		for(var i=0;i<operacionesGesper.length;i++){
			promesas.push(operacionesGesper[i].persona);
		}
		
		for(var i=0;i<promesas.length;i++){
			promesas[i].then(
				function(persona) {		
					
					/*if (operacionesGesper[i].actualizada)
						persona.update(function(err){
							if (err) console.error("Error importando persona. Actualización fallida. " + err);
							else console.error();
						});
					else*/ persona.save(function(err){
						if (err) console.error("Error importando persona. Creación fallida. " + err);
					});
					
				},
				function(err){
					console.error("Error. importando persona. Reject en promesa.");
				}
			);
		}
		
		Q.all(promesas).then(function(personas){			
			for(var i=0;i<personas.length;i++){
				resultado.push({"persona":personas[i],"actualizada":operacionesGesper[i].actualizada});
			}
			res.json(resultado);
		});
	}
}

function getColumn(x){
	return mapping[x];
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




exports.personassearchlist = function(models,Q)
{
	return function(req, res) {
		
		var Persona = models.persona();
		var Procedimiento = models.procedimiento();
		
		var defer_persona = Q.defer();
		var defer_procedimiento = Q.defer();
		

		/// 1. Buscamos personas en la tabla personas.
		Persona.find({},{codplaza:true,login:true,nombre:true,apellidos:true},function(err,data){
			if (err) {
				console.error(err); res.status(500); res.end(); defer_persona.reject(err);		
			} else {

				defer_persona.resolve(data);
			}			
		});

		/// 2. Buscamos personas como responsables de procedimientos ... ¡¡¡Y que no estén en el primer grupo¡¡¡
		Procedimiento.aggregate()
			.unwind("responsables")
			.group({"_id": {
								"login": "$responsables.login",
								"codplaza": "$responsables.codplaza"
							},
					"nombre": {"$first":"$responsables.nombre"},
					"apellidos":{"$first":"$responsables.apellidos"}
					})
			.exec(function(err,data){
				if (err) {
					console.error(err); res.status(500); res.end(); defer_procedimiento.reject(err); 			
				} else {

					defer_procedimiento.resolve(data);
				}
			});
			
		Q.all([defer_persona.promise, defer_procedimiento.promise]).then(function(data){
			var r = {};
			var response = [];
			var personas_by_persona = data[0];
			var personas_by_responsable = data[1];
			for(var i=0;i<personas_by_persona.length;i++){
				var persona = personas_by_persona[i];
				var idr = persona.login+"-"+persona.codplaza;
				r[idr] = persona;			
				response.push( {data: persona.login+" ; "+persona.codplaza+" ; "+
							persona.nombre+" "+persona.apellidos});
			}
			for(var i=0;i<personas_by_responsable.length;i++){
				var persona = personas_by_responsable[i];
				var idr = persona._id.login+'-'+persona._id.codplaza;
				if (typeof r[idr] === 'undefined') {
					console.log("Saltandose "+idr);
					r[idr] = persona;
					response.push({data:persona._id.login+" ; "+persona._id.codplaza+" ; "+persona.nombre+" "+persona.apellidos});
				}
			}

			res.json(response);
		});
	}
};


