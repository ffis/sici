


function PermisoCtrl($rootScope,$scope,$location,$window,Arbol,Session,PermisosList,PersonasSearchList,ProcedimientoList,PermisosProcedimientoList,PermisosDirectosProcedimientoList,Jerarquia, Permiso, PersonasByPuesto, PersonasByLogin, PersonasByRegexp, Persona, $q, Procedimiento,PermisosByLoginPlaza,PermisosDelegar, PermisosByLoginPlaza, PermisosDelegarSeleccionado, PermisoToDelete, PermisoProcedimientoToDelete, ProcedimientosByResponsable) {
	$rootScope.nav = 'permisos';
	$window.document.title ='SICI: Permisos';

	$scope.arbol = Arbol.query();
	$scope.oculto = false;	
	$scope.is_show_recursive_users = false;
	$scope.is_show_inherited_users = false;
	$scope.show_responsables = true;
	$scope.show_form_add_permiso = false;
	$scope.personas_plazas = [];
	$scope.persona_o_plaza = null;
	$scope.show_details_permiso = false;
	$scope.logincarm = "";
	$scope.procedimiento_seleccionado;
	$scope.seleccionado_organica = false;	
	$scope.nodo_jerarquia = null;
	$scope.usuarioencontrado = false;
	$scope.nuevousuario = {};
	$scope.is_nuevousuario = false;
	
	$scope.usuariosbuscado = "";
	$scope.ousuariobuscado = {};
	$scope.normal_user_permisos;
	$scope.permisoallogin = false;

	$scope.cachejerarquias = {};
	$scope.cachepersonas = {};
	
	$scope.superuser = $rootScope.superuser();
	$rootScope.superuser().then(function(superuser){
		if (!superuser) {
			
			var login = $rootScope.session.login || "-";
			var cod_plaza = $rootScope.session.codplaza || "-";
			var permisosaux = PersonasByLoginPlaza.query({"login":login,"cod_plaza":cod_plaza}, function(){
				$scope.normal_user_permisos = [];
				for(var i=0;i<permisosaux.length;i++) {
					if (permisosaux[i].grantoption) 
						$scope.normal_user_permisos.push(permisosaux[i]);
				}				
			});		
		}
	});

	$scope.insersect_safe = function(a, b)
		{
		  var ai=0, bi=0;
		  var result = new Array();

		  for(ai=0;ai<a.length;ai++){
		  	for(bi=0;bi<b.length;bi++){
		  		if (a[ai]==b[bi]) result.push(a[ai]);
		  	}
		  }

		  return result;
		};
		
	$scope.delegar = function(normal_user_usuariodelegado) {
		var partes = normal_user_usuariodelegado.split("-");
		var login = "-";
		var cod_plaza = "-";
		
		if (partes[1])
			cod_plaza = partes[1];
			
		if (partes[0])
			login = partes[0];
		
		if ( cod_plaza != '-' && $scope.permisoallogin ) {
			if (login!='-' && login!='')
				cod_plaza = '-';
			else if (!confirm('No se dispone del login del usuario seleccionado. ¿Desea asignar el permiso a su plaza?'))
				return;
		} 
			
				
		if (login!='-' || cod_plaza!='-') {
			var permisos_delegados;
			if ( !$rootScope.permisoscalculados.superuser && $scope.procedimiento_seleccionado && !$scope.seleccionado_organica && confirm('Ha seleccionado un procedimiento. ¿Delegar unicamente sobre el procedimiento seleccionado?')){
				if ($rootScope.permisoscalculados.procedimientosescritura.indexOf($scope.procedimiento_seleccionado.codigo)>=0)
					permisos_delegados = PermisosDelegarSeleccionado.query({'login':login,'cod_plaza':cod_plaza,'procedimiento':$scope.procedimiento_seleccionado.codigo},function(){
						alert('Permiso delegado correctamente');
					});
				else alert('No tiene permiso sobre el procedimiento');
			} else { 
				if ($rootScope.permisoscalculados.jerarquialectura.indexOf($scope.seleccionado.id)>=0 || 
					$rootScope.permisoscalculados.jerarquiaescritura.indexOf($scope.seleccionado.id)>=0)
					permisos_delegados = PermisosDelegar.query({'login':login,'cod_plaza':cod_plaza},function(){
						alert('Permiso delegado correctamente');
					});
				else alert('No tiene permiso sobre el nodo de la orgánica');
			}
		}
		
		
	};
	
	
	$scope.clearFormNuevoPermiso = function(){
		$scope.cb_grantoption = false;
		$scope.psuperuser = false;
		$scope.w_option = false;
	};

	$scope.addPermiso = function() {
		if ($scope.seleccionado !== 'undefined') {
			//delete $scope.usuarioseleccionado ;			
			$scope.nuevousuario = {};
			$scope.show_form_add_permiso = true;
		}
	}	

	$scope.show_recursive_users = function(){
		$scope.is_show_recursive_users = true;
		$scope.is_show_inherited_users = false;
		
		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);		
	}

	$scope.getPersonas = function(viewValue) {
		var regex = ""+viewValue;
		if (viewValue.length>2) {
			var p = PersonasByRegexp.query({"regex":viewValue}).$promise;
			return p;
		}
		else return [];
	};	
	
	$scope.show_inherited_users	 = function(){
		$scope.is_show_inherited_users = true;
		$scope.is_show_recursive_users = false;
		
		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);		
	}
	
	$scope.show_normal = function(){
		$scope.is_show_recursive_users = false;
		$scope.is_show_inherited_users = false;

		if ($scope.seleccionado_organica) $scope.setSeleccionado($scope.seleccionado);		
		else $scope.setProcSeleccionado($scope.procedimiento_seleccionado);
	}
		
	$scope.$watch("usuariosbuscado", function(old, _new){
		if (_new.indexOf('-')!==-1) {
			var partes = _new.split("-");
			var pd = $q.defer();
			var pp = pd.promise;
			if (partes[0] && partes[0]!=""){
				p = PersonasByLogin.query({"login":partes[0]},function(){
					if (p.length>0) {
						pd.resolve(p[0]);
					} else pd.reject();
				});
			} else if (partes.length>1 && partes[1]!="") {
				p = PersonasByPuesto.query({"cod_plaza":partes[1]},function(){
					if (p.length>0) {
						pd.resolve(p[0]);
					} else pd.reject();
				});			
			} else pd.reject();
			
			pp.then(function(persona){
				ousuariobuscado = persona;
			});
		}
	});
		
	$scope.$watch('usuarioseleccionado', function(old, _new){
		if ($scope.usuarioseleccionado) {
			if (nuevousuario) $scope.nuevousuario = {};
			$scope.usuarioencontrado = true;			
		} else {
			$scope.usuarioencontrado = false;
		}
	});	
	
	$scope.crearnuevousuario = function() {
		$scope.usuarioencontrado = false;
		delete $scope.usuarioseleccionado ;
		$scope.is_nuevousuario = true;
		
	}
	
	$scope._crearnuevousuario = function(){
		if ( ($scope.nuevousuario.login || $scope.nuevousuario.plaza) && $scope.is_nuevousuario) {			
			Persona.save(nuevousuario, function() {				
				$scope.usuarioseleccionado = nuevousuario;
				$scope.nuevousuario = {};				
			});
			$scope.usuarioseleccionado = $scope.showPersona(nuevousuario);
			$scope.nuevousuario = {};
		}
	}

	$scope.cancelarnuevousuario = function(){
		$scope.nuevousuario = {};
		$scope.is_nuevousuario = false;
	}


	
	$scope.$watch('nuevousuario', function(old, _new){
		if ($scope.nuevousuario.login && $scope.usuarioseleccionado ) {
			delete $scope.usuarioseleccionado ;
		} else {
			
			$scope.is_nuevousuario = false;
		}
	});
	

	$scope.on_usuariobuscado_selected = function(item, model, label){
		
		$scope.usuariodetalle = item;
		$scope.seleccionado_organica = false;
		$scope.showDetailsPermiso();
		$scope.permisostotales = {};
		var peraux = {};

		var args = {'login': (item.login ? item.login : '-'), 'cod_plaza':(item.codplaza ? item.codplaza : '-')};
		
		$scope.permisos = PermisosByLoginPlaza.query(args,function(){
			$scope.permisostotales.permisos = $scope.permisos; 
			$scope.procedimientos = [];
			for(var i = 0;i<$scope.permisos.length;i++){
				var p = $scope.permisos[i];				
				for(var j=0;j<p.procedimientosdirectalectura.length;j++){					
					var cod = p.procedimientosdirectalectura[i];
					if (typeof peraux[cod] !== 'undefined') {
						var proc = Procedimiento.get(cod, function(){
							if (proc.cod_plaza == p.codplaza) {
								peraux[cod]=p;
								$scope.procedimientos.push(p);
							}
						});
					}
				}
				for(var j=0;j<p.procedimientosdirectaescritura.length;j++){
					var cod = p.procedimientosdirectaescritura[i];
					if (typeof peraux[cod] !== 'undefined') {
						var proc = Procedimiento.get(cod, function(){
							if (proc.cod_plaza == p.codplaza) {
								peraux[cod]=p;
								$scope.procedimientos.push(p);
							}
						});
					}
				}

			}

			$scope.permisostotales.procedimientos = (item.codplaza?ProcedimientosByResponsable.query({codplaza:item.codplaza}):[]);
			$scope.procedimientos = $scope.permisostotales.procedimientos;
		});
	};


	$scope.getJerarquia = function(idjerarquia){			
		return Jerarquia.query({'id':idjerarquia});
	};
	

	$scope.crearpermiso2 = function(spersona,w_option,grantoption,psuperuser,permisoallogin) {
		$scope.w_option = w_option;
		$scope.cb_grantoption = grantoption;
		$scope.psuperuser = psuperuser;
		$scope.permisoallogin = permisoallogin;

		var partes = spersona.split("-");
		if (partes.length<1)
		{
			alert('No se ha podido crear el permiso');
			return;
		}
		var loginpersona = partes[0];	

		if ($scope.procedimiento_seleccionado && $scope.propietario && $rootScope.permisoscalculados.procedimientosescritura.indexOf($scope.procedimiento_seleccionado.codigo)>0 ){
			if (partes.length<2) {
				alert('No se encuentra el código de plaza de la persona buscada');
				return;
			}
			var codplaza = partes[1];
			var proc = Procedimiento.get({'codigo':$scope.procedimiento_seleccionado.codigo},function(){
				proc.cod_plaza = $codpaza;
				proc.$update(function(){
					var per = PersonasByPuesto.query({"cod_plaza":codplaza},function(){
						for(var i=0;i<per.length;i++){
							per.habilitado = true;
							per.$update(function(){
								console.log("Persona habilitada");
							});
						}
					});
				});
			});
			return;
		} else if ($rootScope.permisoscalculados.jerarquiaescritura.indexOf($scope.seleccionado.id)===-1 && $rootScope.permisoscalculados.jerarquialectura.indexOf($scope.seleccionado.id)===-1){
			alert('No tiene permiso sobre este nodo');
			return;
		}


		var permiso;
		var deferred = $q.defer();
		var promise = deferred.promise;
		var persona ;
		
		if (loginpersona!='' && $scope.permisoallogin) {
			persona = PersonasByLogin.query({"login":loginpersona},function(){	
				if (persona.length>0) deferred.resolve(persona[0]);
				else deferred.reject();
			});
		} else if (partes.length>1 && partes[1]!="") {
			persona = PersonasByPuesto.query({"cod_plaza":partes[1]},function(){
				if (persona.length>0) deferred.resolve(persona[0]);
				else deferred.reject();				
			});
		} else console.log('ERROR '+loginpersona+" ; "+$scope.permisoallogin);
					

		promise.then(function(persona){	
			permiso = {};

			if (!$scope.permisoallogin && persona.codplaza) {
				permiso.codplaza = persona.codplaza;
			}
			else {
				permiso.login = persona.login;					
			}

			if ($scope.cb_grantoption) {
				permiso.grantoption = true;
			}

			permiso.superuser = !!$scope.psuperuser;
			
			if ($scope.seleccionado_organica && $scope.seleccionado) {				
				permiso.jerarquiadirectalectura = [ $scope.seleccionado.id ];
				permiso.jerarquialectura = [ $scope.seleccionado.id ];
				if ($scope.w_option) {
					permiso.jerarquiadirectaescritura = [ $scope.seleccionado.id ];
					permiso.jerarquiaescritura = [ $scope.seleccionado.id ];
				}
				permiso.procedimientodirectalectura = [];
				permiso.procedimientodirectaescritura = [];
			} else if ($scope.procedimiento_seleccionado) {
				permiso.jerarquiadirectaescritura = [ ];
				permiso.jerarquiadirectalectura = [ ];
				permiso.procedimientosdirectalectura = [ $scope.procedimiento_seleccionado.codigo ];
				permiso.procedimientoslectura =  [ $scope.procedimiento_seleccionado.codigo ];
				if ($scope.w_option) {
					permiso.procedimientosdirectaescritura = [ $scope.procedimiento_seleccionado.codigo ];
					permiso.procedimientosescritura =  [ $scope.procedimiento_seleccionado.codigo ];
				} 
			}
			
						
			Permiso.create(permiso,function(){
				delete $scope.usuarioseleccionado ;
				$scope.nuevousuario = {};
				$scope.clearFormNuevoPermiso();
				// recalcula los permisos cargados en la lista
				if ($scope.seleccionado_organica)
					$scope.setSeleccionado($scope.seleccionado);
				else if ($scope.procedimiento_seleccionado){
					$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
				}
				alert('Permiso creado.');
			});	

			
		}, function(err){
			alert('Error asignando permisos ');
			console.log(err);
		});
	}
	
	$scope.crearpermiso = function(usuarioseleccionado,w_option,grantoption,psuperuser,permisoallogin) {

		if (usuarioseleccionado)
		{		
			$scope.crearpermiso2(usuarioseleccionado,w_option,grantoption,psuperuser, permisoallogin);
		} else {
			alert('No ha seleccionado ninguna persona');
		}
	};
	
	$scope.eliminarPermiso = function(permiso) {
		if (confirm('Si continúa se eliminará el permiso sobre el nodo ' + $scope.seleccionado.title))
		{
			if ($scope.seleccionado_organica) {
				console.log("!$seleccionado_organica.. cargando proc ... so:"+$scope.seleccionado_organica+" ; sdp "+$scope.show_details_permiso);
				PermisoToDelete.delete_permiso({'idpermiso':permiso._id,'idjerarquia':$scope.seleccionado.id},function(){
					$scope.setSeleccionado($scope.seleccionado);
				});
			} else if (!$scope.show_details_permiso) {
				console.log("!$show_details_permiso.. cargando proc");
				PermisoProcedimientoToDelete.delete_permiso({'idpermiso':permiso._id,'idprocedimiento':$scope.procedimiento_seleccionado.codigo}, function(){
					$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
				});
			} else {
				console.log("provocando usuariobuscando_selected");
				$scope.on_usuariobuscado_selected($scope.usuariodetalle,null,null);
			}
		}
	};
	
	/*
	$scope.on_usuariobuscado_selected = function(item, model, label){
		
		$scope.usuariodetalle = item;
		
		$scope.show_details_permiso = true;	
	*/
	
	$scope.eliminarDefinitivamentePermiso = function(permiso){
		if (confirm('Si continúa se eliminará el permiso completa y definitivamente'))
		{
			var p = Permiso.get({id:permiso._id}, function(){
				p.$delete({id:p._id},function(err){
					if ($scope.seleccionado_organica) {
						console.log("!$seleccionado_organica.. cargando proc ... so:"+$scope.seleccionado_organica+" ; sdp "+$scope.show_details_permiso);
						$scope.setSeleccionado($scope.seleccionado);		
					} else if ($scope.show_details_permiso){
						console.log("provocando usuariobuscando_selected");
						$scope.on_usuariobuscado_selected($scope.usuariodetalle,null,null);
					} else {
						console.log("!$show_details_permiso.. cargando proc");
						$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
					}
				});				
			})
		}
	}

	$scope.searchUser = function(){
		alert('No implementado');
	}
	
	$scope.eliminarResponable = function(procedimiento, responsable) {
		alert('Función no implementada');
	};
	
	$scope.showDetailsPermiso = function(){
		$scope.show_details_permiso = true;
		$scope.seleccionado = false;		
	}
	
	$scope.jerarquia = [];
	$scope.pjerarquia = $q.defer();
	$rootScope.jerarquialectura().then(
		function(jerarquialectura){ 
			$scope.jerarquia=$scope.jerarquia.concat(jerarquialectura); 
			$rootScope.jerarquiaescritura().then(function(jerarquiaescritura){ 
				$scope.jerarquia=$scope.jerarquia.concat(jerarquiaescritura); 
				$scope.pjerarquia.resolve($scope.jerarquia);
			},function(err){$scope.pjerarquia.reject(err);});
		},
		function(err){
			$scope.pjerarquia.reject(err);
		}
	);
	
	$rootScope.superuser().then(function(superuser){ $scope.superuser = superuser; });
	
	$scope.fj = function(item) {
		if ($scope.jerarquia.indexOf(item.id)!=-1 )
			return true;		
		if (item.nodes) for(var i=0;i<item.nodes.length;i++) 
			if ($scope.filtrojerarquia(item.nodes[i])) 
				return true;		
		return false;
	};
	

	$scope.filtrojerarquia = function(item) {
		var dfj = $q.defer();		
		$scope.pjerarquia.promise.then(
			function(j){ 
				dfj.resolve($scope.fj(item)); 
				$scope.filtrojerarquia = $scope.fj; 
			},
			function(err){ dfj.reject(err); }
		);
		return dfj.promise;
	};

	

	$scope.getObjetoPermisoUsuario = function(permiso){
		console.log("usuariodetalle:"+$scope.usuariodetalle);
		if ($scope.usuarioseleccionado || $scope.usuariodetalle){					
			var resultado = permiso.jerarquiadirectaescritura.concat(permiso.jerarquiadirectalectura).filter(function (e, i, arr) {
					return arr.lastIndexOf(e) === i;
			});			
			console.log(permiso);
			console.log("resultado:");
			console.log(resultado);
			var oresultado = [];
			for(var i=0;i<resultado.length;i++)
			{
				oresultado.push(Jerarquia.query({"id":resultado[i]}));
			}
			return oresultado;
		}
		return [];
	};

	$scope.getObjetoPermiso = function(permiso) {
		
		if ($scope.seleccionado_organica){	// si lo que se encuentra selecccionado es un nodo de organica

			if ($scope.seleccionado && $scope.nodo_jerarquia) { // si está seleccionado y se ha cargado nodo_jerarquia
				var objeto = -1;
				var distancia = 1000000;
				var s_array_busqueda = "ancestros";
				

				if ($scope.is_show_inherited_users) // si mostramos los permisos heredados, buscamos en los ancestros, así como en el directo
					s_array_busqueda = "ancestros";
				else if ($scope.is_show_recursive_users) // si mostramos los permisos recursivamente, buscamos entre los descendientes.
					s_array_busqueda = "descendientes"; 

				var jl = permiso.jerarquiadirectalectura;
				var je = permiso.jerarquiadirectaescritura;
				

				if (!permiso.jerarquiadirectalectura) jl = [];
				if (!permiso.jerarquiadirectaescritura) je = [];
				
				if (permiso.jerarquiadirectalectura.length==0 && permiso.jerarquiadirectaescritura.length==0)
				{
					jl = permiso.jerarquialectura;
				}
				
				
				if ( jl.indexOf( $scope.seleccionado.id ) !== -1  //si es un permiso directo sobre el nodo actual, lo devolvemos sin más
					|| je.indexOf( $scope.seleccionado.id ) !== -1
					) {

					if (typeof $scope.cachejerarquias["idx"+$scope.seleccionado.id] !== 'undefined')
						return [$scope.cachejerarquias["idx"+$scope.seleccionado.id]];
					else {
						var rj = Jerarquia.query({"id":$scope.seleccionado.id});
						$scope.cachejerarquias["idx"+$scope.seleccionado.id] = rj;
						return [rj];				
					}
				}


				var array_interseccion_permisos = [];
				if (s_array_busqueda != "")
					array_interseccion_permisos = $scope.nodo_jerarquia[s_array_busqueda];


				var objs = [];
				if (Array.isArray(jl) && 
					Array.isArray(je) &&
					Array.isArray(array_interseccion_permisos))
						//objs = intersect_safe(permiso.jerarquiadirectalectura.concat(permiso.jerarquiadirectaescritura),array_interseccion_permisos);
					{
						objs = objs.concat(je);
						for(var i=0;i<jl.length;i++) if (objs.indexOf(jl[i])==-1)
							objs.push(jl[i]);

						objs = $scope.insersect_safe(objs,array_interseccion_permisos);

					}
				else  {
					console.error("Error, alguno de los arrays no es tal");
					return objs;
				}
				
				var resultado = [];
				for(var i=0;i<objs.length;i++){
					if (typeof $scope.cachejerarquias["idx"+objs[i]] !== 'undefined')
						resultado[i] = $scope.cachejerarquias["idx"+objs[i]];
					else {
						var rj = Jerarquia.query({"id":objs[i]});
						$scope.cachejerarquias["idx"+objs[i]] = rj;
						resultado[i] = rj;
					}
				}				
				return resultado;
			} 		
		} 
	};
	
	
	$scope.filtrosocultos = false;
	
	$scope.setSeleccionado = function(seleccionad){
		if (seleccionad) {
			$scope.setSeleccionGenerico();			
			$scope.seleccionado = seleccionad;
			$scope.seleccionado_organica = true;
			$rootScope.setTitle(seleccionad.title); 
			
			//$scope.procedimientos = ProcedimientoList.query({idjerarquia:seleccionad.id}); 
			var filtropermisos = {"idjerarquia":seleccionad.id, 'recursivo':($scope.is_show_recursive_users?1:($scope.is_show_inherited_users?2:0))};
			$scope.permisostotales = PermisosList.query(filtropermisos, function() {
				$scope.permisos = $scope.permisostotales.permisos;
				$scope.procedimientos = $scope.permisostotales.procedimientos;
			});		
			var filtroRequest = {"id":$scope.seleccionado.id};			
			$scope.nodo_jerarquia = Jerarquia.query(filtroRequest);
			// si no están cargados los procedimientos del nodo actual, los cargamos
			if (!$scope.seleccionado.procedimientos) for(var i=0;i<$scope.arbol.length;i++) {
				$scope.loadProcedimientos($scope.seleccionado, $scope.arbol[i]);
			}
		}
	};
	
	$scope.setProcSeleccionado = function(procedimiento)
	{
		if (procedimiento) {
			$scope.setSeleccionGenerico();			
			$scope.procedimiento_seleccionado = procedimiento;
			$scope.seleccionado_organica = false;
			$rootScope.setTitle('['+procedimiento.codigo+'] '+procedimiento.description);
			var procesar_permisos_procedimiento = function(){
				$scope.permisos = $scope.permisostotales;
				$scope.procedimientos = [procedimiento];
			} ;
			if ($scope.is_show_inherited_users) {
				$scope.permisostotales = PermisosProcedimientoList.query({'codigoprocedimiento':$scope.procedimiento_seleccionado.codigo}, procesar_permisos_procedimiento);			
			} else {
				$scope.permisostotales = PermisosDirectosProcedimientoList.query({'codigoprocedimiento':$scope.procedimiento_seleccionado.codigo}, procesar_permisos_procedimiento );			
			}
		}
	}
	
	$scope.setSeleccionGenerico = function(){
		$scope.show_form_add_permiso = false;
		$scope.cumplimentados = 0;
		$scope.count = 1;
		$scope.persona_o_plaza = '';
		$scope.show_details_permiso=false;
		/*** formulario de nuevo usuario limpio**/
		$scope.usuarioencontrado = false;		
		$scope.nuevousuario = {};
		$scope.is_nuevousuario = false;	
		$scope.usuariosbuscado = "";		
		/*** ***/
	}
		
	$scope.loadProcedimientos = function(seleccionado, nodo){
		if (!seleccionado.procedimientos) {
			if (seleccionado.id == nodo.id) {
				// cargamos los procedimientos directamente asignados a este nodo. No recursivamente.
				seleccionado.procedimientos = ProcedimientoList.query({"idjerarquia":seleccionado.id,"recursivo":0});				
			} else {
				if (nodo.nodes) for(var i=0;i<nodo.nodes.length;i++)
				{
					$scope.loadProcedimientos(seleccionado, nodo.nodes[i]);
				}
			}
		} else console.log("Ya están cargados");
	}

	$scope.colorText = $rootScope.colorText;
	
	$scope.isR = function(permiso) {
		return true;
	}
	
	$scope.isW = function(permiso) {
	
		if ($scope.seleccionado_organica)
			return typeof $scope.seleccionado !== 'undefined' 
				&& typeof $scope.seleccionado.id !== 'undefined' 
				&& typeof permiso.jerarquiadirectaescritura !== 'undefined'
				&& Array.isArray(permiso.jerarquiaescritura)
				&& permiso.jerarquiaescritura.indexOf($scope.seleccionado.id)!==-1;
		else {
				
			return typeof $scope.procedimiento_seleccionado !== 'undefined'
				&& $scope.procedimiento_seleccionado.codigo !== 'undefined'
				&& permiso.procedimientosescritura !== 'undefined'
				&& Array.isArray(permiso.procedimientosescritura) 
				&& permiso.procedimientosescritura.indexOf($scope.procedimiento_seleccionado.codigo)!==-1;			
		}
	}

	$scope.isP = function(permiso) {
		return typeof permiso.grantoption !== 'undefined' 
			&& permiso.grantoption > 0;
	}

	$scope.clickHandler = function(e){
	   e.preventDefault();
	}	
	
	$scope.changeW = function(permiso) {
		if ($scope.isW(permiso)) {
			switch ($scope.seleccionado_organica) {
				case true:
					if (!Array.isArray(permiso.jerarquiadirectaescritura) || permiso.jerarquiadirectaescritura.indexOf($scope.seleccionado.id)===-1){
						alert('Este usuario no tiene un permiso directo sobre esta orgánica. Se trata de un permiso heredado. La operación no puede realizarse.');
					} else if (Array.isArray(permiso.jerarquiadirectaescritura)) {
						permiso.jerarquiadirectaescritura.splice(permiso.jerarquiadirectaescritura.indexOf($scope.seleccionado.id),1);
					}
					break;
				case false:
					if (!Array.isArray(permiso.procedimientodirectaescritura) || permiso.procedimientodirectaescritura.indexOf($scope.procedimiento_seleccionado.codigo)===-1){
							alert('Este usuario no tiene un permiso directo sobre este procedimiento. Se trata de un permiso heredado. La operación no puede realizarse.');
					} else if (Array.isArray(permiso.procedimientodirectaescritura)){
							permiso.procedimientodirectaescritura.splice(permiso.procedimientodirectaescritura.indexOf($scope.procedimiento_seleccionado.codigo),1);
					}
					break;			
			}
		} else {
			switch ($scope.seleccionado_organica) {
				case true:
						if (Array.isArray(permiso.jerarquiadirectaescritura)){
							if (permiso.jerarquiadirectaescritura.indexOf($scope.seleccionado.id)==-1) // esto no sería necesario si todo fuera sincronizado. Pero puede que ande esperando a que se haya actualizado "jerarquiaescritura" en el servidor
								permiso.jerarquiadirectaescritura.push($scope.seleccionado.id);							
						}
						else permiso.jerarquiadirectaescritura = [ $scope.seleccionado.id ];
						
					break;
				case false:
						if (Array.isArray(permiso.procedimientodirectaescritura))
							if (permiso.procedimientodirectaescritura.indexOf($scope.seleccionado.id)==-1) // esto no sería necesario si todo fuera sincronizado. Pero puede que ande esperando a que se haya actualizado "procedimientoescritura" en el servidor
								permiso.procedimientodirectaescritura.push($scope.procedimiento_seleccionado.codigo);
						else permiso.procedimientodirectaescritura = [$scope.procedimiento_seleccionado.codigo];
						
					break;			
			}
		}	
		Permiso.update({id:permiso._id},permiso, function(npermiso){
			if ($scope.seleccionado_organica){
				permiso.jerarquiadirectaescritura = npermiso.jerarquiadirectaescritura;
				permiso.jerarquiaescritura = npermiso.jerarquiaescritura
				$scope.setSeleccionado($scope.seleccionado);	
			} else if ($scope.procedimiento_seleccionado){
				permiso.procedimientosdirectaescritura = npermiso.procedimientosdirectaescritura;
				permiso.procedimientosescritura = npermiso.procedimientosescritura
				$scope.setProcSeleccionado($scope.procedimiento_seleccionado);					
			}		
		});
	}
	
	$scope.changeP = function(permiso) {
		permiso.grantoption = !permiso.grantoption;
		Permiso.update({id:permiso._id},permiso);
	}
	
	$scope.isFiltroSelected= function(filtro,key,fa){
		return (typeof filtro[key] != 'undefined' && fa.name==filtro[key]);
	};
	
	var personas_plazas_aux = PersonasSearchList.query({},function(err,data){
		$scope.personas_plazas=[];
		for(var i=0;i<personas_plazas_aux.length;i++)
		{
			$scope.personas_plazas.push(personas_plazas_aux[i].data);
		}
	});
	
//	$scope.getPersonas = function(viewValue) {
//		var regex = ""+viewValue
//		if (viewValue.length>2) {
//			var p = PersonasByRegexp.query({"regex":viewValue}).$promise;
//			return p;
//		}
//		else return [];
//	};

	
	$scope.showPersona = function (persona){
		if (persona && persona.login && persona.codplaza && persona.nombre && persona.apellidos)
			return persona.login + "-" + persona.codplaza + "-" + persona.nombre+ " " + persona.apellidos;
		else return "";
	}	
	
	$scope.getPersona = function(permiso){
		var busqueda = "";
		if (permiso.login!=null && permiso.login!='' && typeof permiso.login !== 'undefined')
			busqueda = permiso.login;
		else if (permiso.codplaza!=null && permiso.codplaza!='' && typeof permiso.codplaza !== 'undefined')
			busqueda = permiso.codplaza;
		else return '';

		if (typeof $scope.cachepersonas[busqueda] !== 'undefined')
			var p = $scope.cachepersonas[busqueda];
		else {
			var p = PersonasByRegexp.query({"regex":busqueda});
			 $scope.cachepersonas[busqueda] = p;
		}
		return p;
	}
	$scope.getResponsable = function(procedimiento){
		var busqueda = "";
		var p = [];
		if (typeof procedimiento.cod_plaza !== 'undefined' && procedimiento.cod_plaza)
			var p = PersonasByPuesto({"cod_plaza":procedimiento.cod_plaza});
		return p;
	}
    
	
}
PermisoCtrl.$inject = ['$rootScope','$scope','$location','$window','Arbol','Session','PermisosList','PersonasSearchList','ProcedimientoList','PermisosProcedimientoList', 'PermisosDirectosProcedimientoList','Jerarquia','Permiso', 'PersonasByPuesto', 'PersonasByLogin', 'PersonasByRegexp','Persona','$q','Procedimiento','PermisosByLoginPlaza','PermisosDelegar','PermisosByLoginPlaza','PermisosDelegarSeleccionado', 'PermisoToDelete', 'PermisoProcedimientoToDelete','ProcedimientosByResponsable'];
