

exports.removePermisoProcedimiento = function(models, Q) {
	return function(req, res) {
		if (typeof req.params.idprocedimiento !== 'undefined' && !isNaN(parseInt(req.params.idprocedimiento)) &&
			typeof req.params.idpermiso !== 'undefined' && !isNaN(parseInt(req.params.idpermiso)))
		{
			var Permiso = models.permiso();
			var content = req.body;
			var idpermiso = req.params.permiso;
			var idprocedimiento = req.params.procedimiento;

			Permiso.findOne({'id':idpermiso},function(err,data){
				var index_r = permiso.procedimientosdirectalectura.indexOf(idprocedimiento);
				var index_w = permiso.procedimientosdirectaescritura.indexOf(idprocedimiento);
				var index_rc = permiso.procedimientoslectura.indexOf(idprocedimiento);
				var index_wc = permiso.jerarquiadirectaescritura.indexOf(idprocedimiento);
				
				if (index_r!==-1) 
					permiso.procedimientosdirectalectura.splice(index_r,1);
				if (index_w!==-1)
					permiso.procedimientosdirectaescritura.splice(index_w,1);
				if (index_rc!==-1)
					permiso.procedimientoslectura.splice(index_rc,1);
				if (index_wc!==-1)
					permiso.jerarquiadirectaescritura.splice(index_wc,1);
					
				/////////// CORTOCIRCUITO PARA NO ELIMINAR DATOS EN DESESARROLLO.	
					
				return;	
					
				if (permiso.procedimientosdirectalectura.length == 0 &&
						(typeof permiso.jerarquiadirectalectura === 'undefined' 
						||
						permiso.jerarquiadirectalectura.length == 0
				)) 
				{
					Permiso.remove({'id':idpermiso},function(err){
						if (err)  res.send({'error':'An error has occurred'});
						else res.send(content);
					});
				} else {
					Permiso.update({'id':idpermiso},permiso,{upsert:false}, function(e) {
						if (err) res.send({'error':'An error has occurred'});
						else res.send(permiso);
					});
				}
				
			});
		}
		console.error('Invocación inválida para la eliminación de un permiso'); res.status(500); res.end(); return;
	}
}


exports.removePermisoJerarquia = function(models, Q) {
	return function(req, res) {
		if (typeof req.params.idjerarquia !== 'undefined' && !isNaN(parseInt(req.params.idjerarquia)) &&
			typeof req.params.idpermiso !== 'undefined' && !isNaN(parseInt(req.params.idpermiso)))
		{
			var Permiso = models.permiso();
			var content = req.body;
			var idpermiso = req.params.permiso;
			var idjerarquia = req.params.jerarquia;

			Permiso.findOne({'id':idpermiso},function(err,data){
				var index_r = permiso.jerarquiadirectalectura.indexOf(idjerarquia);
				var index_w = permiso.jerarquiadirectaescritura.indexOf(idjerarquia);
				var index_rc = permiso.jerarquialectura.indexOf(idjerarquia);
				var index_wc = permiso.jerarquiaescritura.indexOf(idjerarquia);
				
				if (index_r!==-1) 
					permiso.jerarquiadirectalectura.splice(index_r,1);
				if (index_w!==-1)
					permiso.jerarquiadirectaescritura.splice(index_w,1);
				if (index_rc!==-1)
					permiso.jerarquialectura.splice(index_rc,1);
				if (index_wc!==-1)
					permiso.jerarquialectura.splice(index_wc,1);
					
				/////////// CORTOCIRCUITO PARA NO ELIMINAR DATOS EN DESESARROLLO.	
					
				return;	
					
				if (permiso.jerarquiadirectalectura.length == 0 &&
						(typeof permiso.procedimientosdirectalectura === 'undefined' 
						||
						permiso.procedimientosdirectalectura.length == 0
				)) 
				{
					Permiso.remove({'id':idpermiso},function(err){
						if (err)  res.send({'error':'An error has occurred'});
						else res.send(content);
					});
				} else {
					Permiso.update({'id':idpermiso},permiso,{upsert:false}, function(e) {
						if (err) res.send({'error':'An error has occurred'});
						else res.send(permiso);
					});
				}
				
			});
		}
		console.error('Invocación inválida para la eliminación de un permiso'); res.status(500); res.end(); return;
	}
}


//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el id de jerarquía
//// indicado o sobre alguno de sus descendientes (si el parámetro de petición "recursivo" es 1)  , 
//// así como los permisos directos sobre los procedimientos que cuelgan de tales jerarquías
exports.permisosList = function(models, Q){
	return function(req,res){
		var Permiso = models.permiso();		
		var dpermisos = Q.defer();		
		var promise_permisos = dpermisos.promise;
		var recursivo = (typeof req.params.recursivo !== 'undefined' && req.params.recursivo==1 ? true : false);
		
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
					
					var jerarquias_buscadas = recursivo ? jerarquia.descendientes : [];
					
					if (!Array.isArray(jerarquias_buscadas))
						jerarquias_buscadas = [];											
					jerarquias_buscadas.push(jerarquia.id);

					var Procedimiento = models.procedimiento();					
					var dprocedimiento = Q.defer();
					var promise_procedimiento = dprocedimiento.promise;
					var query = Procedimiento.find({'idjerarquia':{'$in':jerarquias_buscadas}});
					query.select({cod_plaza:1,codigo:1,responsables:1,idjerarquia:1,denominacion:1});
					query.exec(function(err,procedimientos){
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

//// Devuelve las instancias de permiso que tienen concedido permiso directo sobre el procedimiento indicado
exports.permisosDirectosProcedimientoList = function(models,Q){
	return function(req,res){
		var Permiso = models.permiso();		
		var dpermisos = Q.defer();
		var promise_permisos = dpermisos.promise;

		if (typeof req.params.codigoprocedimiento !== 'undefined') {								
				var idp = req.params.codigoprocedimiento;
				var restriccion = {'procedimientodirectalectura':idp};
				Permiso.find(restriccion, function(err, permisos){
					if (err) {console.error(restriccion); console.error(err); res.status(500); res.end(); return; }
					else res.json(permisos);
				});
		} else {
			var err = 'Error. Código de procedimiento no presente o inválido';
			console.error(restriccion); console.error(err); res.status(500); res.end(); return;
		}	
	};
};


exports.update = function(models) {
	return function(req, res) {
		console.error('Funcionalidad no implementada');
	}
}

exports.create = function(models) {
	return function(req,res) {				
		console.error('Funcionalidad no implementada');		
	}
}




