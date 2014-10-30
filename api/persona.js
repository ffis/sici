
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
