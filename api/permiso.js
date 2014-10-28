
//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía
//// indicado o sobre alguno de sus descendientes, así como los permisos directos sobre los procedimientos 
//// que cuelgan de tales jerarquías
exports.permisosList = function(models, Q){
	return function(req,res){
		var Permiso = models.permiso();		
		var dpermisos = Q.defer();		
		var promise_permisos = dpermisos.promise;
		
		if (typeof req.params.idjerarquia !== 'undefined') {
			if (isNaN(parseInt(req.params.idjerarquia)))
				dpermisos.reject('Error. Id jerarquía no válido');
			else {												
				// obtenemos todos los permisos otorgados sobre esta jerarquía y sus descendientes.
				var idj = parseInt(req.params.idjerarquia);
				var Jerarquia = models.jerarquia();
				var restriccionjerarquia = {};
				var d = Q.defer();
				var promise = d.promise;
				// buscamos la jerarquia indicada
				Jerarquia.findOne({'id':idj}, function(err, data){
					if (err) {  d.reject(err) ; }
					else d.resolve(data);
				});


				promise.then(function(jerarquia){					
					// configuramos una búsqueda de la jerarquía actual más los descendientes
					
					var jerarquias_buscadas = jerarquia.descendientes;
					if (!Array.isArray(jerarquias_buscadas))
						jerarquias_buscadas = [];
					jerarquias_buscadas.push(jerarquia.id);

					var Procedimiento = models.procedimiento();					
					var dprocedimiento = Q.defer();
					var promise_procedimiento = dprocedimiento.promise;
					Procedimiento.find({'idjerarquia':{'$in':jerarquias_buscadas}},function(err,procedimientos){
						if (err) {  dprocedimiento.reject(err);}
						else {
							dprocedimiento.resolve(procedimientos);
						}
					});
					

					promise_procedimiento.then(function(procedimientos){
						
						var idsprocedimientos = [];						
						procedimientos.forEach(function(value,index){
							idsprocedimientos.push(value.codigo);
						});						
						console.log(idsprocedimientos.length);
						
						var restriccion = {
							'$or': [
								{'jerarquiadirectalectura':{'$in':jerarquias_buscadas}},
								{'procedimientosdirectalectura':{'$in':idsprocedimientos}}
							]
						};
						
						
						var respuesta = {
							'procedimientos':procedimientos
						};
						
						Permiso.find(restriccion, function(err, permisos){
							if (err) { dpermisos.reject(err); }
							else {							
								respuesta.permisos = permisos;
								respuesta.totallength = procedimientos.length + permisos.length;								
								dpermisos.resolve(respuesta);				
							}
						});

					}, function(err){
						dpermisos.reject(err);
					});

				}, function(error){
					dpermisos.reject(err);
				});
			}
		} else {
			Permiso.find({},function(err, permisos){
				dpermisos.resolve(permisos);
			});
		}

		promise_permisos.then(function(permisos){ // permisos ok
			res.json(permisos);
		}, function(err){ // error recuperando permisos
			console.error(restriccion); console.error(err); res.status(500); res.end(); return;
		})
				
	}	
};

//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía indicado 
exports.permisosDirectosList = function(models, Q){
	return function(req,res){
		var Permiso = models.permiso();		
		var dpermisos = Q.defer();
		var promise_permisos = dpermisos.promise;

		if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia))) {								
				var idj = parseInt(req.params.idjerarquia);
				var restriccion = {'jerarquiadirectalectura':idj};
				Permiso.find(restriccion, function(err, permisos){
					if (err) {console.error(restriccion); console.error(err); res.status(500); res.end(); return; }
					else res.json(permisos);
				});
		} else {
			var err = 'Error. Id de jerarquía no presente o inválido';
			console.error(restriccion); console.error(err); res.status(500); res.end(); return;
		}
	
	};
};
