

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


function getPermisosByLoginPlaza(req, res, models ,Q ,login, cod_plaza)
{
		var Permiso = models.permiso();
		var restriccion = {};
		
		console.log(req.params);

		if (!login && req.params.login && req.params.login!="-")
			login = req.params.login;			
			
		if (!cod_plaza && req.params.cod_plaza && req.params.cod_plaza!="-")
			cod_plaza = req.params.cod_plaza;			
			
		if (login && cod_plaza)
			restriccion = { "$or":[
					{ 'login' : login },
					{ 'codplaza' : cod_plaza }
				] };
		else if (login)
			restriccion.login = login;						
		else if (cod_plaza)
			restriccion.codplaza = cod_plaza;

		console.log(restriccion);
		
		var df = Q.defer();
		var permisos_promise = df.promise;
		
		if (login!="-" || cod_plaza!="-")
			Permiso.find(restriccion,function(err, permisos){
				if (err) df.reject(err);
				else df.resolve(permisos);
			});		
		else 
			df.resolve([]);
		
		return permisos_promise;
}


exports.delegarpermisosProcedimiento = function(models,Q){
	return function(req,res){
		var proc = req.params.procedimiento;
		console.log(req.user);
		/**if (req.user.permisoscalculados.procedimientosescritura.indexOf(proc)!==-1 ){*/
			var Permiso = models.permiso();
			var Procedimiento = models.procedimiento();
			var Jerarquia = models.jerarquia();
			Procedimiento.findOne({'codigo':proc},function(err,procedimiento){
				if (err){console.error("Imposible salvar nuevo permiso"); console.error(err); res.status(500); res.end(); return;}
				var idjerarquia= procedimiento.idjerarquia;
				Jerarquia.findOne({'id':idjerarquia},function(err, jerarquia){
					if (err){console.error("Imposible salvar nuevo permiso (2)"); console.error(err); res.status(500); res.end(); return;}
					var ep = {};
					if (req.params.cod_plaza && req.params.cod_plaza!='-' && req.params.cod_plaza!='') ep.codplaza = req.params.cod_plaza;
					if (req.params.login && req.params.login!='-' && req.params.login!='') ep.login = req.params.login;
					ep.jerarquialectura = [idjerarquia];
					ep.jerarquiaescritura = [idjerarquia];
					ep.jerarquiadirectalectura = [idjerarquia];
					ep.jerarquiadirectaescritura = [idjerarquia];
					ep.procedimientosescritura = [procedimiento.codigo];
					ep.procedimientoslectura = [procedimiento.codigo];
					ep.procedimientosdirectalectura = [procedimiento.codigo];
					ep.procedimientosdirectaescritura = [procedimiento.codigo];
					ep.superuser = 0;
					ep.cod_plaza_grantt = req.user.login;
					ep.descripcion = 'Permisos delegados por ' + ep.cod_plaza_grantt;
					ep.grantoption = false;

					Permiso.find({'$or':[{'procedimientoescritura' : procedimiento.codigo},{'procedimientosdirectaescritura' : procedimiento.codigo}]},function(err,procs){
						if (err) {
								console.error("Imposible salvar nuevo permiso (5)"); console.error(err); res.status(500); res.end(); return;
						}
						var caducidad = new Date();
						caducidad.setFullYear(caducidad.getFullYear() + 2); ////////// PARCHE POR LAS CADUCIDADES A NULL
						for(var i=0;i<procs.length;i++){
							var ptemp = procs[i];
							if (ptemp.caducidad && ptemp.caducidad.getTime()>caducidad.getTime())
								caducidad = ptemp.caducidad;
						}
						ep.caducidad = caducidad;

						var op = new Permiso(ep);
						console.log(op);
						op.save(function(err){
							if (err) {
								console.error("Imposible salvar nuevo permiso (3)"); console.error(err); res.status(500); res.end(); return;
							} else {		
								res.json(op);
							}							
						});
					});
				});
			});
		/*} else {console.error("Imposible salvar nuevo permiso (4)");  res.status(500); res.end(); return;}*/
	};
};

exports.delegarpermisos = function(models,Q)
{
	return function(req, res) {
		var Permiso = models.permiso();
		var promesa_permisos = getPermisosByLoginPlaza(req, res, models,Q,req.user.login,req.user.codplaza);
		promesa_permisos.then(
			function(permisos){
				console.log("nump "+permisos.length);
				var promesas_permisos = [];
				for(var i=0;i<permisos.length;i++)
				{	
					var p = JSON.parse(JSON.stringify(permisos[i]));	
					
					delete p._id;		
					if (req.params.login && req.params.login != "-")
						p.login=req.params.login
					if (req.params.cod_plaza && req.params.cod_plaza != "-")
						p.codplaza = req.params.cod_plaza;
					p.cod_plaza_grantt = (permisos[i].codplaza?permisos[i].codplaza:permisos[i].login);
										
					var op = new Permiso(p);														
					op.grantoption = false;
					
					var defer = Q.defer();
					promesas_permisos.push(defer.promise);
										
					op.save(function(err){
						if (err) {
							console.error("Imposible salvar nuevo permiso"); console.error(err); res.status(500); res.end(); return;
							defer.reject(err);
						} else {		
							defer.resolve(p);
						}
					});
				}
				Q.all(promesas_permisos).then(function(permisos){
					//console.log(permisos);
					res.json(permisos);
				}, function(err){
					console.error("Problemas modificando permisos...");
					console.error(err); res.status(500); res.end();				
				});
			},
			function(err){
				console.error(err); res.status(500); res.end(); return;
			}
		);		
	}
}

exports.permisosByLoginPlaza = function(models,Q) {
	return function(req, res) {
		var promesa_permisos = getPermisosByLoginPlaza(req, res, models,Q);
		promesa_permisos.then(
			function(permisos){

				res.json(permisos)
			},
			function(err){
				console.error(err); res.status(500); res.end(); return;
			}
		);
	}
};

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
		var heredado = (typeof req.params.recursivo !== 'undefined' && req.params.recursivo==2 ? true : false);
		
		if (typeof req.params.idjerarquia !== 'undefined') {
			if (isNaN(parseInt(req.params.idjerarquia)) || 
				(req.user.permisoscalculados.jerarquialectura.indexOf(parseInt(req.params.idjerarquia))===-1 && 
				 req.user.permisoscalculados.jerarquiaescritura.indexOf(parseInt(req.params.idjerarquia))===-1)
				)
				dpermisos.reject('Error. Id jerarquía no válido');
			else if (!heredado) {												
				// obtenemos todos los permisos otorgados sobre esta jerarquía y sus descendientes.
				var idj = parseInt(req.params.idjerarquia);
				var Jerarquia = models.jerarquia();
				var restriccionjerarquia = {};
				var d = Q.defer();
				var promise = d.promise;
				// buscamos la jerarquia indicada
				Jerarquia.findOne({'id':idj}, function(err, data)
				{
					if (err) d.reject(err) ;
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
			} else if (heredado) {
				var idj = parseInt(req.params.idjerarquia);				
				var restriccion = {'jerarquialectura' : idj};

				Permiso.find(restriccion, function(err,permisos){
					if (err) 
						dpermisos.reject(err); 
					else 
						dpermisos.resolve({ 'procedimientos' : [], 'permisos' : permisos, 'totallength' : permisos.length });					
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


//// Devuelve las instancias de permiso que tienen concedido permiso sobre el procedimiento indicado
exports.permisosProcedimientoList = function(models,Q){
	return function(req,res){
		var Permiso = models.permiso();		
		var dpermisos = Q.defer();
		var promise_permisos = dpermisos.promise;

		console.log("Buscando procedimiento "+req.params.codigoprocedimiento);
		if (typeof req.params.codigoprocedimiento !== 'undefined') {								
				var idp = req.params.codigoprocedimiento;
				var restriccion = {'procedimientoslectura':idp};
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

exports.create = function(models, Q, recalculate){
	return function(req,res){
	var Permiso = models.permiso();
	var arg_permiso = req.body;
	var permiso = {
	 login : arg_permiso.login,
	 codplaza : arg_permiso.codplaza,
	 jerarquialectura : (typeof arg_permiso.jerarquialectura !== 'undefined' ? arg_permiso.jerarquialectura : []),
	 jerarquiaescritura : (typeof arg_permiso.jerarquiaescritura !== 'undefined' ? arg_permiso.jerarquiaescritura : []),
	 jerarquiadirectalectura : (typeof arg_permiso.jerarquiadirectalectura !== 'undefined' ? arg_permiso.jerarquiadirectalectura : []),
	 jerarquiadirectaescritura : (typeof arg_permiso.jerarquiadirectaescritura !== 'undefined' ? arg_permiso.jerarquiadirectaescritura : []),
	 procedimientoslectura : (typeof arg_permiso.procedimientoslectura !== 'undefined' ? arg_permiso.procedimientoslectura : []),
	 procedimientosescritura : (typeof arg_permiso.procedimientosescritura !== 'undefined' ? arg_permiso.procedimientosescritura : []),
	 procedimientosdirectalectura : (typeof arg_permiso.procedimientosdirectalectura !== 'undefined' ? arg_permiso.procedimientosdirectalectura : []),
	 procedimientosdirectaescritura : (typeof arg_permiso.procedimientosdirectaescritura !== 'undefined' ? arg_permiso.procedimientosdirectaescritura : []),
	 caducidad : usuarioactual.caducidad,
	 descripcion : '',
	 grantoption  : arg_permiso.grantoption,
	 superuser : arg_permiso.superuser
	};	
	
	var dpersona = Q.defer();
	var ppersona = dpersona.promise;
		
	if (permiso.codplaza) {
		Persona.findOne({'codplaza': permiso.codplaza},function(err,usuario){
			if (err) dpersona.reject(err);
			else dpersona.resolve(usuario);				
		});
	} else {
		Persona.findOne({'login': permiso.login},function(err,usuario){
			if (err) dpersona.reject(err);
			else dpersona.resolve(usuario);				
		});	
	}
	
	ppersona.then(function(){
		opermiso = new Permiso(permiso);
		opermiso.save(permiso,function(err){
			if (err) {
				console.error(err); res.status(500); res.end(); return;
			} else {
					recalculate.recalculate.softCalculatePermiso(Q, models, permiso).then(
						function(permiso){
							res.json(permiso);
						},
						function(err){
							console.error(err); res.status(500); res.end(); return;
						}
					);
				
			}
		});		
	},function(err){
		console.error(err); res.status(500); res.end(); return;
	});	
	}
}
/*
exports.create = function(models) {
	return function(req,res) {				
		var Permiso = models.permiso();
		var Persona = models.persona();
		var tipoobjpermiso = req.body.tiposeleccion;
		
		var dpersona = Q.defer();
		var ppersona = dpersona.promise;
		
		Persona.findOne({'login': req.user.login},function(err,usuario){
				if (err) dpersona.reject(err);
				else dpersona.resolve(usuario);				
		});
		
		Permiso.save(permiso,function(err,nuevopermiso){
				res.json(nuevopermiso);
				if (req.body.nombre && req.body.apellidos) {
					var persona = {
						'nombre' : req.body.nombre,
						'apellidos' : req.body.apellidos,
						'genero' : req.body.genero,
						'telefono' : req.body.telefono,
						'habilitado' : 1					
					};
					Persona.create(persona, function(err,nuevapersona){
						console.log("Creada nueva persona");
						console.log(nuevapersona);
					});
				}
			});		
		
		ppersona.then(function(usuarioactual){
			var permiso = {
			 jerarquialectura : [],
			 jerarquiaescritura : [],
			 jerarquiadirectalectura : [],
			 jerarquiadirectaescritura : [],
			 procedimientoslectura : [],
			 procedimientosescritura : [],
			 procedimientosdirectalectura : [],
			 procedimientosdirectaescritura : [],
			 caducidad : usuarioactual.caducidad,
			 descripcion : '',
			 grantoption  : req.body.grantoption,
			 superuser : 0
			};
			
			var err="";
			if (tiposeleccion == 'jerarquia') {
				if (!isNaN(parseInt(req.body.nodojerarquia))) {				
					var id = parseInt(req.body.nodojerarquia);
					permiso.jerarquiadirectalectura.push(id);
					if (req.body.w_option)
						permiso.jerarquiadirectaescritura.push(id);
				} else {
					err = "Error. Indentificador de jerarquía incorrecto";
				}
			} else if ( tiposeleccion == "procedimiento") {
				if (req.body.procedimiento && req.body.procedimiento!="") {
					permiso.procedimientosdirectalectura.push(req.body.procedimiento);
					if (req.body.w_option)
						permiso.procedimientodirectaescritura.push(req.body.procedimiento);
				}else {
					err = "Error. Identificador de procedimiento incorrecto";
				}			
			}
			
			if (err!="") {			
				console.error(err); res.status(500); res.end(); return;
			}
					
			Permiso.create(permiso,function(err,nuevopermiso){
				res.json(nuevopermiso);
				if (req.body.nombre && req.body.apellidos) {
					var persona = {
						'nombre' : req.body.nombre,
						'apellidos' : req.body.apellidos,
						'genero' : req.body.genero,
						'telefono' : req.body.telefono,
						'habilitado' : 1					
					};
					Persona.create(persona, function(err,nuevapersona){
						console.log("Creada nueva persona");
						console.log(nuevapersona);
					});
				}
			});


		
		}, function(err){
			console.error(err); res.status(500); res.end(); return;
		});	
	}
}*/




