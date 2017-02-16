(function(angular){
	'use strict';
	angular.module('sici')
		.controller('PermisoCtrl',
			['$rootScope', '$scope', '$location', '$window', 'ArbolWithEmptyNodes', 'Session', 'PermisosList', 'PersonasSearchList', 'ProcedimientoList', 'EntidadObjetoList', 'PermisosProcedimientoList', 'PermisosDirectosProcedimientoList', 'PermisosEntidadObjetoList', 'PermisosDirectosEntidadObjetoList', 'Jerarquia', 'Permiso', 'PersonasByPuesto', 'PersonasByLogin', 'PersonasByRegexp', 'Persona', '$q', 'Procedimiento', 'EntidadObjeto', 'PermisosDelegar', 'PermisosByLoginPlaza', 'PermisosDelegarSeleccionado', 'PermisoToDelete', 'PermisoProcedimientoToDelete', 'ProcedimientosByResponsable', 'EntidadesObjetoByResponsable', '$http', '$log',
				function ($rootScope, $scope, $location, $window, ArbolWithEmptyNodes, Session, PermisosList, PersonasSearchList, ProcedimientoList, EntidadObjetoList, PermisosProcedimientoList, PermisosDirectosProcedimientoList, PermisosEntidadObjetoList, PermisosDirectosEntidadObjetoList, Jerarquia, Permiso, PersonasByPuesto, PersonasByLogin, PersonasByRegexp, Persona, $q, Procedimiento, EntidadObjeto, PermisosDelegar, PermisosByLoginPlaza, PermisosDelegarSeleccionado, PermisoToDelete, PermisoProcedimientoToDelete, ProcedimientosByResponsable, EntidadesObjetoByResponsable, $http, $log) {
					$rootScope.nav = 'permisos';
					$rootScope.setTitle('Permisos');

					$scope.arbol = ArbolWithEmptyNodes.query({},
						function(){
							/* alteramos el arbol para añadirle un atribuyo calculado */
							for (var i = 0; i < $scope.arbol.length; i++){
								$scope.addSumatorioCartasProcedimientos($scope.arbol[i]);
							}
						});
					$scope.oculto = false;
					$scope.is_show_recursive_users = false;
					$scope.is_show_inherited_users = false;
					$scope.show_responsables = true;
					$scope.show_form_add_permiso = false;
					$scope.personas_plazas = [];
					$scope.persona_o_plaza = null;
					$scope.show_details_permiso = false;
					$scope.logincarm = '';
					$scope.procedimiento_seleccionado = undefined;
					$scope.carta_seleccionada = undefined;
					$scope.seleccionado_organica = false;
					$scope.seleccionado_procedimiento = false;
					$scope.nodo_jerarquia = null;
					$scope.usuarioencontrado = false;
					$scope.nuevousuario = {};
					$scope.is_nuevousuario = false;

					$scope.usuariosbuscado = '';
					$scope.ousuariobuscado = {};
					$scope.normal_user_permisos = undefined;
					$scope.permisoallogin = false;

					$scope.cachejerarquias = {};
					$scope.cachepersonas = {};
					$scope.filtrosocultos = false;

					$scope.indexcontrolorganica = 0;
					$scope.indexcontrolprocedimiento = 1;
					$scope.indexcontrolentidadobjeto = 2;
					$scope.variablescontrolpermisos = {
						controlvars : ['seleccionado_organica', 'seleccionado_procedimiento', 'carta_seleccionada'],
						seleccionado : ['seleccionado', 'procedimiento_seleccionado', 'carta_seleccionada'],
						denominacion_objeto : ['jerarquia', 'procedimiento', 'entidadobjeto'],
						setSeleccionado : ['setSeleccionado', 'setProcSeleccionado', 'setCartaSeleccionada'],
						texto_determinante : ['la', 'el', 'la'],
						array_permiso : {
							directalectura : ['jerarquiadirectalectura', 'procedimientosdirectalectura', 'entidadobjetodirectalectura'],
							directaescritura: ['jerarquiadirectaescritura', 'procedimientosdirectaescritura', 'entidadobjetodirectaescritura'],
							lectura : ['jerarquialectura', 'procedimientoslectura', 'entidadobjetolectura'],
							escritura: ['jerarquiaescritura', 'procedimientosescritura', 'entidadobjetoescritura']
						}
					};

					$scope.superuser = $rootScope.superuser();
					$rootScope.superuser().then(function(superuser){
						if (!superuser) {
							var login = $rootScope.session.login || '-';
							var cod_plaza = $rootScope.session.codplaza || '-';
							var permisosaux = PermisosByLoginPlaza.query({login: login, 'cod_plaza': cod_plaza}, function(){
								$scope.normal_user_permisos = [];
								for (var i = 0; i < permisosaux.length; i++) {
									if (permisosaux[i].grantoption) {
										$scope.normal_user_permisos.push(permisosaux[i]);
									}
								}
							});
						}
					});

					$scope.addSumatorioCartasProcedimientos = function(nodo){
						nodo.sumatorio = 0;
						if (typeof nodo.numcartas !== 'undefined'){
							nodo.sumatorio += nodo.numcartas;
						}
						if (typeof nodo.numprocedimientos !== 'undefined'){
							nodo.sumatorio += nodo.numprocedimientos;
						}
						if (typeof nodo.nodes !== 'undefined' && nodo.nodes !== null){
							for (var i = 0; i < nodo.nodes.length;i++){
								$scope.addSumatorioCartasProcedimientos(nodo.nodes[i]);
							}
						}
					};


					$scope.insersect_safe = function(a, b){
						var ai = 0, bi = 0;
						var result = [];

						for (ai = 0; ai < a.length; ai++){
							for (bi = 0; bi < b.length; bi++){
								if (a[ai] === b[bi]){
									result.push(a[ai]);
								}
							}
						}
						return result;
					};

					$scope.delegar = function(normalUserUsuariodelegado) {
						var partes = normalUserUsuariodelegado.split('-');
						var login = '-';
						var cod_plaza = '-';

						if (partes[1]){
							cod_plaza = partes[1].trim();
						}

						if (partes[0]){
							login = partes[0].trim();
						}

						if ( cod_plaza !== '-' && $scope.permisoallogin ) {
							if (login !== '-' && login !== ''){
								cod_plaza = '-';
							}
							else if (!$window.confirm('No se dispone del login del usuario seleccionado. ¿Desea asignar el permiso a su plaza?')){
								return;
							}
						}

						if (login !== '-' || cod_plaza !== '-') {
							if ( !$rootScope.permisoscalculados.superuser && $scope.procedimiento_seleccionado && !$scope.seleccionado_organica && $window.confirm('Ha seleccionado un procedimiento. ¿Delegar unicamente sobre el procedimiento seleccionado?')){
								if ($rootScope.permisoscalculados.procedimientosescritura.indexOf($scope.procedimiento_seleccionado.codigo) >= 0){
									PermisosDelegarSeleccionado.query({login: login, cod_plaza: cod_plaza, procedimiento: $scope.procedimiento_seleccionado.codigo}, function(){
										$window.alert('Permiso delegado correctamente');
										if ($scope.seleccionado_organica){
											$scope.setSeleccionado($scope.seleccionado);
										} else if ($scope.seleccionado_procedimiento){
											$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
										} else {
											$scope.setCartaSeleccionada($scope.carta_seleccionada);
										}
									});
								}else{
									$window.alert('No tiene permiso sobre el procedimiento');
								}
							} else if ( !$rootScope.permisoscalculados.superuser && $scope.carta_seleccionada && !$scope.seleccionado_organica && $window.confirm('Ha seleccionado una entidad-objeto. ¿Delegar unicamente sobre la entidad-objeto?')){
								if ($rootScope.permisoscalculados.entidadobjetoescritura.indexOf($scope.carta_seleccionada._id) >= 0){
									PermisosDelegarSeleccionado.query({login: login, cod_plaza: cod_plaza, entidadobjeto: $scope.carta_seleccionada._id}, function(){
										$window.alert('Permiso delegado correctamente');
										if ($scope.seleccionado_organica){
											$scope.setSeleccionado($scope.seleccionado);
										} else if ($scope.seleccionado_procedimiento){
											$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
										} else {
											$scope.setCartaSeleccionada($scope.carta_seleccionada);
										}
									});
								}else{
									$window.alert('No tiene permiso sobre la carta');
								}
							}
							else {
								if ($rootScope.permisoscalculados.jerarquialectura.indexOf($scope.seleccionado.id) >= 0 ||
									$rootScope.permisoscalculados.jerarquiaescritura.indexOf($scope.seleccionado.id) >= 0
								){
									PermisosDelegar.query({'login': login, 'cod_plaza': cod_plaza}, function(){
										$window.alert('Permiso delegado correctamente');
										if ($scope.seleccionado_organica){
											$scope.setSeleccionado($scope.seleccionado);
										}
										else if ($scope.seleccionado_procedimiento){
											$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
										} else {
											$scope.setCartaSeleccionada($scope.carta_seleccionada);
										}
									});
								} else {
									$window.alert('No tiene permiso sobre el nodo de la orgánica');
								}
							}
						}
					};

					$scope.clearFormNuevoPermiso = function(){
						$scope.cb_grantoption = false;
						$scope.psuperuser = false;
						$scope.w_option = false;
					};

					$scope.addPermiso = function() {
						if (typeof $scope.seleccionado !== 'undefined') {
							//delete $scope.usuarioseleccionado ;
							$scope.nuevousuario = {};
							$scope.show_form_add_permiso = true;
						}
					};

					$scope.show_recursive_users = function(){
						$scope.is_show_recursive_users = true;
						$scope.is_show_inherited_users = false;

						if ($scope.seleccionado_organica){
							$scope.setSeleccionado($scope.seleccionado);
						}
						else if ($scope.seleccionado_procedimiento){
							$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
						} else {
							$scope.setCartaSeleccionada($scope.carta_seleccionada);
						}		};

					$scope.getPersonas = function(viewValue) {
						if (viewValue.length > 2) {
							/*
							TODO: revisar posible bug
							var regex = '' + viewValue;
							*/
							return PersonasByRegexp.query({regex: viewValue}).$promise;
						}
						return [];
					};

					$scope.show_inherited_users	 = function(){
						$scope.is_show_inherited_users = true;
						$scope.is_show_recursive_users = false;

						if ($scope.seleccionado_organica){ $scope.setSeleccionado($scope.seleccionado); }
						else if ($scope.seleccionado_procedimiento){
							$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
						} else {
							$scope.setCartaSeleccionada($scope.carta_seleccionada);
						}
					};

					$scope.show_normal = function(){
						$scope.is_show_recursive_users = false;
						$scope.is_show_inherited_users = false;

						if ($scope.seleccionado_organica){
							$scope.setSeleccionado($scope.seleccionado);
						}else if ($scope.seleccionado_procedimiento){
							$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
						} else {
							$scope.setCartaSeleccionada($scope.carta_seleccionada);
						}
					};

					$scope.$watch('usuariosbuscado', function(old, _new){
						if (_new.indexOf('-') > -1) {
							var partes = _new.split('-');
							var pd = $q.defer();
							var pp = pd.promise;
							if (partes[0] && partes[0] !== ''){
								PersonasByLogin.query({login: partes[0]}, function(p){
									if (p.length){
										pd.resolve(p[0]);
									} else {
										pd.reject();
									}
								});
							} else if (partes.length > 1 && partes[1] !== '') {
								PersonasByPuesto.query({'cod_plaza': partes[1]}, function(p){
									if (p.length){
										pd.resolve(p[0]);
									} else {
										pd.reject();
									}
								});
							} else {
								pd.reject();
							}

							pp.then(function(persona){
								$scope.ousuariobuscado = persona;
							});
						}
					});

					$scope.$watch('usuarioseleccionado', function(){
						if ($scope.usuarioseleccionado) {
							if ($scope.nuevousuario){
								$scope.nuevousuario = {};
							}
							$scope.usuarioencontrado = true;
						} else {
							$scope.usuarioencontrado = false;
						}
					});

					$scope.crearnuevousuario = function(){
						$scope.usuarioencontrado = false;
						delete $scope.usuarioseleccionado;
						$scope.is_nuevousuario = true;
					};

					$scope._crearnuevousuario = function(){
						if ( ($scope.nuevousuario.login || $scope.nuevousuario.plaza) && $scope.is_nuevousuario) {
							Persona.save($scope.nuevousuario, function() {
								$scope.usuarioseleccionado = $scope.nuevousuario;
								$scope.nuevousuario = {};
							});
							$scope.usuarioseleccionado = $scope.showPersona($scope.nuevousuario);
							$scope.nuevousuario = {};
						}
					};

					$scope.cancelarnuevousuario = function(){
						$scope.nuevousuario = {};
						$scope.is_nuevousuario = false;
					};

					$scope.$watch('nuevousuario', function(){
						if ($scope.nuevousuario.login && $scope.usuarioseleccionado ) {
							delete $scope.usuarioseleccionado;
						} else {
							$scope.is_nuevousuario = false;
						}
					});

					$scope.on_usuariobuscado_selected = function(item){

						$scope.usuariodetalle = item;
						$scope.seleccionado_organica = false;
						$scope.seleccionado_procedimiento = false;
						$scope.showDetailsPermiso();
						$scope.permisostotales = {};

						var args = {'login': (item.login ? item.login : '-'), 'cod_plaza':(item.codplaza ? item.codplaza : '-')};

						/**
						*	TODO:
						*		mal uso de definición de funciones dentro del bucle,
						*		es probable que no accedan a los datos que aparenta.
						*/
						$scope.permisos = PermisosByLoginPlaza.query(args, function(){
							var i = 0, j = 0, p, cod, proc, eo;
							$scope.permisostotales.permisos = $scope.permisos;
							$scope.procedimientos = [];
							$scope.cartas = [];
							var peraux = {};
							var perauxc = {};
							for (i = 0; i < $scope.permisos.length; i++){
								p = $scope.permisos[i];
								for (j = 0; j < p.procedimientosdirectalectura.length; j++){
									cod = p.procedimientosdirectalectura[i];
									if (typeof peraux[cod] !== 'undefined') {
										proc = Procedimiento.get(cod, function(){
											if (proc.cod_plaza == p.codplaza) {
												peraux[cod] = p;
												$scope.procedimientos.push(p);
											}
										});
									}
								}
								for (j = 0; j < p.procedimientosdirectaescritura.length; j++){
									cod = p.procedimientosdirectaescritura[i];
									if (typeof peraux[cod] !== 'undefined') {
										proc = Procedimiento.get(cod, function(){
											if (proc.cod_plaza == p.codplaza) {
												peraux[cod] = p;
												$scope.procedimientos.push(p);
											}
										});
									}
								}
								for (j = 0; j < p.entidadobjetodirectalectura.length; j++){
									cod = p.entidadobjetodirectalectura[i];
									if (typeof peraux[cod] !== 'undefined') {
										eo = EntidadObjeto.get(cod, function(){
											if (eo.responsable == p.codplaza) {
												perauxc[cod] = p;
												$scope.cartas.push(p);
											}
										});
									}
								}
								for (j = 0; j < p.entidadobjetodirectaescritura.length; j++){
									cod = p.entidadobjetodirectaescritura[i];
									if (typeof peraux[cod] !== 'undefined') {
										eo = EntidadObjeto.get(cod, function(){
											if (eo.responsable == p.codplaza) {
												perauxc[cod] = p;
												$scope.cartas.push(p);
											}
										});
									}
								}
							}

							$scope.permisostotales.procedimientos = item.codplaza ? ProcedimientosByResponsable.query({codplaza: item.codplaza}) : [];
							$scope.procedimientos = $scope.permisostotales.procedimientos;
							$scope.permisostotales.entidadesobjeto = item.codplaza ? EntidadesObjetoByResponsable.query({codplaza: item.codplaza}) : [];
							$scope.cartas = $scope.permisostotales.entidadesobjeto;
						});
					};

					$scope.getJerarquia = function(idjerarquia){
						return Jerarquia.query({'id': idjerarquia});
					};

					$scope.habilitaPersonas = function(codplaza){
						var logging = function(persona){
							return function(){
								$log.debug('Persona habilitada', persona);
							};
						};
						var per = PersonasByPuesto.query({'cod_plaza': codplaza}, function(){
							for (var i = 0; i < per.length; i++){
								per.habilitado = true;
								per.$update(logging(per));
							}
						});
					};

					$scope.crearpermiso2 = function(spersona, w_option, grantoption, psuperuser, permisoallogin){
						var codplaza;
						$scope.w_option = w_option;
						$scope.cb_grantoption = grantoption;
						$scope.psuperuser = psuperuser;
						$scope.permisoallogin = permisoallogin;

						var partes = spersona.split('-');
						if (partes.length === 0)
						{
							$window.alert('No se ha podido crear el permiso');
							return;
						}
						var loginpersona = partes[0];

						// Cambio de responsable del procedimiento / entidadobjeto
						if ($scope.seleccionado_procedimiento
							&& $scope.propietario
							&& $rootScope.permisoscalculados.procedimientosescritura.indexOf($scope.procedimiento_seleccionado.codigo) > 0 ){

							if (partes.length < 2) {
								$window.alert('No se encuentra el código de plaza de la persona buscada');
								return;
							}
							codplaza = partes[1];
							var proc = Procedimiento.get({'codigo': $scope.procedimiento_seleccionado.codigo}, function(){
								proc.cod_plaza = codplaza;
								proc.$update(function(){
									$scope.habilitaPersonas(codplaza);
								});
							});
							return;
						} else if ($scope.carta_seleccionada
								&& $scope.propietario //¿?
								&& $rootScope.permisoscalculados.entidadobjetoescritura.indexOf($scope.carta_seleccionada._id) > 0 ){

							if (partes.length < 2) {
								$window.alert('No se encuentra el código de plaza de la persona buscada');
								return;
							}

							codplaza = partes[1];
							var eo = EntidadObjeto.get({'_id': $scope.carta_seleccionada._id}, function(){
								eo.responsable = codplaza;
								eo.$update(function(){
									$scope.habilitaPersonas(codplaza);
								});
							});
							return;
						}
						else if ($rootScope.permisoscalculados.jerarquiaescritura.indexOf($scope.seleccionado.id) === -1
								&& $rootScope.permisoscalculados.jerarquialectura.indexOf($scope.seleccionado.id) === -1){
							$window.alert('No tiene permiso sobre este nodo');
							return;
						}

						// Caso en que no se trata de un cambio de responsable.
						var permiso, persona;
						var deferred = $q.defer();
						// buscamos la persona a la que tenemos que aplicar el permiso.
						if (loginpersona !== '' && $scope.permisoallogin) {
							persona = PersonasByLogin.query({login: loginpersona}, function(){
								if (persona.length){
									deferred.resolve(persona[0]);
								} else {
									deferred.reject();
								}
							});
						} else if (partes.length > 1 && partes[1] !== '') {
							persona = PersonasByPuesto.query({'cod_plaza': partes[1]}, function(){
								if (persona.length){
									deferred.resolve(persona[0]);
								} else {
									deferred.reject();
								}
							});
						} else {
							$log.log('ERROR ' + loginpersona + ' ; ' + $scope.permisoallogin);
							deferred.reject();
						}

						// localizada la persona, asignamos el permiso
						deferred.promise.then(function(persona){
							permiso = {};
							// si no es un permiso al login, se asigna a la plaza
							if (!$scope.permisoallogin && persona.codplaza) {
								permiso.codplaza = persona.codplaza;
							// permiso al login
							} else {
								permiso.login = persona.login;
							}

							// ¿tiene permiso de cesión de permisos?
							if ($scope.cb_grantoption){
								permiso.grantoption = true;
							}
							$log.log('Dando permisos');
							$log.log($scope.carta_seleccionada);
							// ¿es super user?
							permiso.superuser = !!$scope.psuperuser;
							// si se aplica a un nodo de orgánica, le atizamos un nodo de organica para lectura al menos
							if ($scope.seleccionado_organica && $scope.seleccionado) {
								permiso.jerarquiadirectalectura = [ $scope.seleccionado.id ];
								permiso.jerarquialectura = [ $scope.seleccionado.id ];
								// si tiene permiso de escritura, le atizamos permiso de escritura
								if ($scope.w_option){
									permiso.jerarquiadirectaescritura = [ $scope.seleccionado.id ];
									permiso.jerarquiaescritura = [ $scope.seleccionado.id ];
								}
								permiso.procedimientosdirectalectura = [];
								permiso.procedimientosdirectaescritura = [];
							// idem para el caso de procedimientos
							} else if ($scope.seleccionado_procedimiento) {
								permiso.jerarquiadirectaescritura = [ ];
								permiso.jerarquiadirectalectura = [ ];
								permiso.procedimientosdirectalectura = [ $scope.procedimiento_seleccionado.codigo ];
								permiso.procedimientoslectura = [ $scope.procedimiento_seleccionado.codigo ];
								if ($scope.w_option) {
									permiso.procedimientosdirectaescritura = [ $scope.procedimiento_seleccionado.codigo ];
									permiso.procedimientosescritura = [ $scope.procedimiento_seleccionado.codigo ];
								}
							} else if ($scope.carta_seleccionada) {
								$log.log('Se trata de una carta. Atizando permiso.');
								permiso.jerarquiadirectaescritura = [ ];
								permiso.jerarquiadirectalectura = [ ];
								permiso.entidadobjetodirectalectura = [ $scope.carta_seleccionada._id ];
								permiso.entidadobjetolectura = [ $scope.carta_seleccionada._id ];
								if ($scope.w_option) {
									permiso.entidadobjetodirectaescritura = [ $scope.carta_seleccionada._id ];
									permiso.entidadobjetoescritura = [ $scope.carta_seleccionada._id ];
								}
							}
							$log.log(permiso);
							Permiso.create(permiso, function(){
								delete $scope.usuarioseleccionado;
								$scope.nuevousuario = {};
								$scope.clearFormNuevoPermiso();
								// recalcula los permisos cargados en la lista
								if ($scope.seleccionado_organica){
									$scope.setSeleccionado($scope.seleccionado);
								}else if ($scope.procedimiento_seleccionado){
									$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
								} else if ($scope.carta_seleccionada){
									$scope.setCartaSeleccionada($scope.carta_seleccionada);
								}
								$window.alert('Permiso creado.');
							});
						}, function(err){
							$window.alert('Error asignando permisos');
							$log.error(err);
						});
					};

					$scope.crearpermiso = function(usuarioseleccionado, w_option, grantoption, psuperuser, permisoallogin) {
						if (usuarioseleccionado){
							$scope.crearpermiso2(usuarioseleccionado, w_option, grantoption, psuperuser, permisoallogin);
						} else {
							$window.alert('No ha seleccionado ninguna persona');
						}
					};

					$scope.eliminarPermiso = function(permiso) {
						if ($window.confirm('Si continúa se eliminará el permiso sobre el nodo ')){
							if ($scope.seleccionado_organica) {
								$log.log('!$seleccionado_organica.. cargando proc ... so:' + $scope.seleccionado_organica + ' ; sdp ' + $scope.show_details_permiso);
								PermisoToDelete.delete_permiso({'idpermiso': permiso._id, 'idjerarquia': $scope.seleccionado.id}, function(){
									$scope.setSeleccionado($scope.seleccionado);
								});
							} else if (!$scope.show_details_permiso) {
								$log.log('!$show_details_permiso.. cargando proc');
								PermisoProcedimientoToDelete.delete_permiso({'idpermiso': permiso._id, 'idprocedimiento': $scope.procedimiento_seleccionado.codigo}, function(){
									$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
								});
							} else {
								$log.log('provocando usuariobuscando_selected');
								$scope.on_usuariobuscado_selected($scope.usuariodetalle, null, null);
							}
						}
					};

					$scope.eliminarDefinitivamentePermiso = function(permiso){
						if ($window.confirm('Si continúa se eliminará el permiso completa y definitivamente')){
							var p = Permiso.get({id: permiso._id}, function(){
								p.$delete({id: p._id}, function(){
									if ($scope.seleccionado_organica) {
										$log.log('!$seleccionado_organica.. cargando proc ... so:' + $scope.seleccionado_organica + ' ; sdp ' + $scope.show_details_permiso);
										$scope.setSeleccionado($scope.seleccionado);
									} else if ($scope.show_details_permiso){
										$log.log('provocando usuariobuscando_selected');
										$scope.on_usuariobuscado_selected($scope.usuariodetalle, null, null);
									} else if ($scope.seleccionado_procedimiento){
										$log.log('!$show_details_permiso.. cargando proc');
										$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
									} else if ($scope.carta_seleccionada){
										$log.log('cargando entidadobjeto') ;
										$scope.setCartaSeleccionada($scope.carta_seleccionada);
									}
								}, function(err){
									$log.error(err);
									$window.alert('Ocurrió un error inesperado. Recargue la página totalmente para ver el estado de consistencia de los datos mostrados.');
									$window.alert(err);
								});
							});
						}
					};

					$scope.searchUser = function(){
						$window.alert('No implementado');
					};

					$scope.eliminarResponsable = function(procedimiento, responsable) {
						$window.alert('Función no implementada');
						$log.log(procedimiento, responsable);
					};

					$scope.showDetailsPermiso = function(){
						$scope.show_details_permiso = true;
						$scope.seleccionado = false;
					};

					$scope.jerarquia = [];
					$scope.pjerarquia = $q.defer();
					$rootScope.jerarquialectura().then(
						function(jerarquialectura){
							$scope.jerarquia = $scope.jerarquia.concat(jerarquialectura);
							$rootScope.jerarquiaescritura().then(function(jerarquiaescritura){
								$scope.jerarquia = $scope.jerarquia.concat(jerarquiaescritura);
								$scope.pjerarquia.resolve($scope.jerarquia);
							}, function(err){
								$scope.pjerarquia.reject(err);
							});
						},
						function(err){
							$scope.pjerarquia.reject(err);
						}
					);

					$rootScope.superuser().then(function(superuser){ $scope.superuser = superuser; });

					$scope.fj = function(item) {
						if ($scope.jerarquia.indexOf(item.id) !== -1 ){
							return true;
						}
						if (item.nodes){
							for (var i = 0; i < item.nodes.length; i++){
								if ($scope.filtrojerarquia(item.nodes[i])){
									return true;
								}
							}
						}
						return false;
					};


					$scope.filtrojerarquia = function(item){
						var dfj = $q.defer();
						$scope.pjerarquia.promise.then(
							function(){
								dfj.resolve($scope.fj(item));
								$scope.filtrojerarquia = $scope.fj;
							},
							function(err){
								dfj.reject(err);
							}
						);
						return dfj.promise;
					};

					$scope.getObjetoPermisoUsuario = function(permiso){
						$log.log('usuariodetalle:' + $scope.usuariodetalle);
						if ($scope.usuarioseleccionado || $scope.usuariodetalle){
							var resultado = permiso.jerarquiadirectaescritura.concat(permiso.jerarquiadirectalectura).filter(function (e, i, arr){
								return arr.lastIndexOf(e) === i;
							});
							$log.log(permiso);
							$log.log('resultado:');
							$log.log(resultado);
							var oresultado = [];
							for (var i = 0; i < resultado.length; i++){
								oresultado.push(Jerarquia.query({id: resultado[i]}));
							}
							return oresultado;
						}
						return [];
					};

					$scope.getObjetoPermiso = function(permiso) {
						var i = 0;
						if ($scope.seleccionado_organica){	// si lo que se encuentra selecccionado es un nodo de organica
							if ($scope.seleccionado && $scope.nodo_jerarquia) { // si está seleccionado y se ha cargado nodo_jerarquia
								var s_array_busqueda = 'ancestros';

								if ($scope.is_show_inherited_users){ // si mostramos los permisos heredados, buscamos en los ancestros, así como en el directo
									s_array_busqueda = 'ancestros';
								}
								else if ($scope.is_show_recursive_users){ // si mostramos los permisos recursivamente, buscamos entre los descendientes.
									s_array_busqueda = 'descendientes';
								}

								var jl = permiso.jerarquiadirectalectura;
								var je = permiso.jerarquiadirectaescritura;

								if (!permiso.jerarquiadirectalectura){ jl = []; }
								if (!permiso.jerarquiadirectaescritura){ je = []; }

								if (permiso.jerarquiadirectalectura.length === 0 && permiso.jerarquiadirectaescritura.length === 0){
									jl = permiso.jerarquialectura;
								}

								if ( jl.indexOf( $scope.seleccionado.id ) !== -1  //si es un permiso directo sobre el nodo actual, lo devolvemos sin más
									|| je.indexOf( $scope.seleccionado.id ) !== -1
									) {

									if (typeof $scope.cachejerarquias['idx' + $scope.seleccionado.id] !== 'undefined'){
										return [$scope.cachejerarquias['idx' + $scope.seleccionado.id]];
									}
									else {
										var rj = Jerarquia.query({id: $scope.seleccionado.id});
										$scope.cachejerarquias['idx' + $scope.seleccionado.id] = rj;
										return [rj];
									}
								}

								var array_interseccion_permisos = [];
								if (s_array_busqueda !== ''){
									array_interseccion_permisos = $scope.nodo_jerarquia[s_array_busqueda];
								}

								var objs = [];
								if ( Array.isArray(jl) && Array.isArray(je) && Array.isArray(array_interseccion_permisos) ) {
									/* objs = intersect_safe(permiso.jerarquiadirectalectura.concat(permiso.jerarquiadirectaescritura),array_interseccion_permisos); */
									objs = objs.concat(je);
									for (i = 0; i < jl.length; i++){
										if (objs.indexOf(jl[i]) === -1){
											objs.push(jl[i]);
										}
									}

									objs = $scope.insersect_safe(objs, array_interseccion_permisos);
								} else {
									$log.error('Error, alguno de los arrays no es tal');
									return objs;
								}

								var resultado = [];
								for (i = 0; i < objs.length; i++){
									if (typeof $scope.cachejerarquias['idx' + objs[i]] !== 'undefined'){
										resultado[i] = $scope.cachejerarquias['idx' + objs[i]];
									} else {
										var rja = Jerarquia.query({'id': objs[i]});
										$scope.cachejerarquias[ 'idx' + objs[i] ] = rja;
										resultado[i] = rj;
									}
								}
								return resultado;
							}
						}
					};

					$scope.setSeleccionado = function(seleccionad){
						var i = 0;
						if (seleccionad) {
							$scope.setSeleccionGenerico();
							$scope.seleccionado = seleccionad;
							$scope.seleccionado_organica = true;
							$scope.seleccionado_procedimiento = false;
							$scope.procedimiento_seleccionado = null;
							$scope.carta_seleccionada = null;
							$rootScope.setTitle(seleccionad.title);

							//$scope.procedimientos = ProcedimientoList.query({idjerarquia:seleccionad.id});
							var filtropermisos = { idjerarquia: seleccionad.id, recursivo: ($scope.is_show_recursive_users ? 1 : ($scope.is_show_inherited_users ? 2 : 0))};
							$scope.permisostotales = PermisosList.query(filtropermisos, function() {
								$scope.permisos = $scope.permisostotales.permisos;
								$scope.procedimientos = $scope.permisostotales.procedimientos;
							});
							var filtroRequest = {id: $scope.seleccionado.id};
							$scope.nodo_jerarquia = Jerarquia.query(filtroRequest);
							// si no están cargados los procedimientos del nodo actual, los cargamos
							$log.log('¿Tiene procedimientos o están cargados?');
							$log.log($scope.seleccionado);
							if (!$scope.seleccionado.procedimientos || $scope.seleccionado.procedimientos.length !== $scope.seleccionado.numprocedimientos){
								$log.log('cargando procedimientos');
								for (i = 0; i < $scope.arbol.length; i++){
									$scope.loadProcedimientos($scope.seleccionado, $scope.arbol[i]);
								}
								$log.log($scope.arbol);
							} else {
								$log.log('Se supone que están cargados');
							}
							if (!$scope.seleccionado.cartas || $scope.seleccionado.cartas.length !== $scope.seleccionado.numcartas){
								$log.log('cargando cartas');
								for (i = 0; i < $scope.arbol.length; i++){
									$scope.loadCartas($scope.seleccionado, $scope.arbol[i]);
								}
							}
						}
					};

					$scope.setProcSeleccionado = function(procedimiento){
						if (procedimiento) {
							$scope.setSeleccionGenerico();
							$scope.procedimiento_seleccionado = procedimiento;
							$scope.seleccionado_organica = false;
							$scope.seleccionado_procedimiento = true;
							$scope.carta_seleccionada = null;
							$rootScope.setTitle('[' + procedimiento.codigo + '] ' + procedimiento.description);
							var procesar_permisos_procedimiento = function(){
								$scope.permisos = $scope.permisostotales;
								$scope.procedimientos = [procedimiento];
							};
							if ($scope.is_show_inherited_users) {
								$scope.permisostotales = PermisosProcedimientoList.query({'codigoprocedimiento': $scope.procedimiento_seleccionado.codigo}, procesar_permisos_procedimiento);
							} else {
								$scope.permisostotales = PermisosDirectosProcedimientoList.query({'codigoprocedimiento': $scope.procedimiento_seleccionado.codigo}, procesar_permisos_procedimiento );
							}
						}
					};

					$scope.setCartaSeleccionada = function(carta){
						if (carta){
							$scope.setSeleccionGenerico();
							$scope.carta_seleccionada = carta;
							$scope.seleccionado_organica = false;
							$scope.seleccionado_procedimiento = false;
							$rootScope.setTitle('[' + carta.codigo + '] ' + carta.denominacion);
							var procesar_permisos_carta = function() {
								$scope.permisos = $scope.permisostotales;
								$scope.cartas = [carta];
							};

							$log.log('Solicitando permisos para la entidad ' + $scope.carta_seleccionada._id);
							$log.log($scope.carta_seleccionada);
							if ($scope.is_show_inherited_users){
								$scope.permisostotales = PermisosEntidadObjetoList.query({'codigoentidadobjeto': $scope.carta_seleccionada._id}, procesar_permisos_carta);
							} else {
								$scope.permisostotales = PermisosDirectosEntidadObjetoList.query({'codigoentidadobjeto': $scope.carta_seleccionada._id}, procesar_permisos_carta);
							}
						}
					};

					$scope.setSeleccionGenerico = function(){
						$scope.show_form_add_permiso = false;
						$scope.cumplimentados = 0;
						$scope.count = 1;
						$scope.persona_o_plaza = '';
						$scope.show_details_permiso = false;
						/*** formulario de nuevo usuario limpio**/
						$scope.usuarioencontrado = false;
						$scope.nuevousuario = {};
						$scope.is_nuevousuario = false;
						$scope.usuariosbuscado = '';
						/*** ***/
					};

					$scope.loadProcedimientos = function(seleccionado, nodo){
						if (!seleccionado.procedimientos || seleccionado.procedimientos.length !== seleccionado.numprocedimientos){
							if (seleccionado.id === nodo.id) {
								// cargamos los procedimientos directamente asignados a este nodo. No recursivamente.
								seleccionado.procedimientos = ProcedimientoList.query({idjerarquia: seleccionado.id, recursivo: 0});
							} else {
								if (nodo.nodes){
									for (var i = 0; i < nodo.nodes.length; i++){
										$scope.loadProcedimientos(seleccionado, nodo.nodes[i]);
									}
								}
								$scope.arbol = $scope.arbol;
							}
						} else {
							$log.log('Ya están cargados... o no');
						}
					};

					$scope.loadCartas = function(seleccionado, nodo){
						if (!seleccionado.cartas){
							if (seleccionado.id === nodo.id){
								seleccionado.cartas = EntidadObjetoList.query({idjerarquia:seleccionado.id, recursivo:0});
							} else {
								if (nodo.nodes){
									for (var i = 0;i < nodo.nodes.length; i++){
										$scope.loadCartas(seleccionado, nodo.nodes[i]);
									}
								}
							}
						} else {
							$log.log('Ya están cargadas');
						}
					};

					$scope.colorText = $rootScope.colorText;

					$scope.isR = function() {
						/* function(permiso) */
						return true;
					};

					$scope.isW = function(permiso) {
						if ($scope.seleccionado_organica){
							return typeof $scope.seleccionado !== 'undefined'
								&& typeof $scope.seleccionado.id !== 'undefined'
								&& typeof permiso.jerarquiadirectaescritura !== 'undefined'
								&& Array.isArray(permiso.jerarquiaescritura)
								&& permiso.jerarquiaescritura.indexOf($scope.seleccionado.id) !== -1;
						}
						else if ($scope.seleccionado_procedimiento) {
							return typeof $scope.procedimiento_seleccionado !== 'undefined'
								&& typeof $scope.procedimiento_seleccionado.codigo !== 'undefined'
								&& typeof permiso.procedimientosescritura !== 'undefined'
								&& Array.isArray(permiso.procedimientosescritura)
								&& permiso.procedimientosescritura.indexOf($scope.procedimiento_seleccionado.codigo) !== -1;
						} else if ($scope.carta_seleccionada){
							return typeof $scope.carta_seleccionada !== 'undefined'
								&& typeof $scope.carta_seleccionada._id !== 'undefined'
								&& typeof permiso.entidadobjetoescritura !== 'undefined'
								&& Array.isArray(permiso.entidadobjetoescritura)
								&& permiso.entidadobjetoescritura.indexOf($scope.carta_seleccionada._id) !== -1;
						}
					};

					$scope.isP = function(permiso) {
						return typeof permiso.grantoption !== 'undefined' && permiso.grantoption > 0;
					};

					$scope.clickHandler = function(e){
						e.preventDefault();
					};

					$scope.changeW_remove_w__template = function(permiso, attr_array_permiso, seleccionado, attr_id, nombre_entidad ) {
						if (!Array.isArray(permiso[attr_array_permiso]) || permiso[attr_array_permiso].indexOf(seleccionado[attr_id]) === -1){
							$window.alert('Este usuario no tiene un permiso directo sobre este ' + nombre_entidad + '. Se trata de un permiso heredado. La operación no puede realizarse.');
						} else if (Array.isArray(permiso[attr_array_permiso])) {
							permiso[attr_array_permiso].splice(permiso[attr_array_permiso].indexOf(seleccionado[attr_id]), 1);
						}
					};

					$scope.changeW_add_w__template = function(permiso, attr_array_permiso, seleccionado, attr_id) {
						if (Array.isArray(permiso[attr_array_permiso])){
							if (permiso[attr_array_permiso].indexOf(seleccionado[attr_id]) === -1){
								// esto no sería necesario si todo fuera sincronizado. Pero puede que ande esperando a que se haya actualizado 'jerarquiaescritura' en el servidor
								permiso[attr_array_permiso].push(seleccionado[attr_id]);
							}
						} else {
							permiso[attr_array_permiso] = [ seleccionado[attr_id] ];
						}
					};

					$scope.changeW = function(permiso) {
						if ($scope.isW(permiso)) {
							if ($scope.seleccionado_organica) {
								$scope.changeW_remove_w__template(permiso, 'jerarquiadirectaescritura', $scope.seleccionado, 'id', 'nodo de orgánica');
							} else if ($scope.seleccionado_procedimiento){
								$scope.changeW_remove_w__template(permiso, 'procedimientosdirectaescritura', $scope.procedimiento_seleccionado, 'codigo', 'procedimiento' );
							} else if ($scope.carta_seleccionada){
								$scope.changeW_remove_w__template(permiso, 'entidadobjetodirectaescritura', $scope.carta_seleccionada, '_id', 'carta');
							}
						} else {
							if ($scope.seleccionado_organica) {
								$scope.changeW_add_w__template(permiso, 'jerarquiadirectaescritura', $scope.seleccionado, 'id');
							} else if ($scope.seleccionado_procedimiento) {
								$scope.changeW_add_w__template(permiso, 'procedimientosdirectaescritura', $scope.procedimiento_seleccionado, 'codigo');
							} else if ($scope.carta_seleccionada){
								$scope.changeW_add_w__template(permiso, 'entidadobjetodirectaescritura', $scope.carta_seleccionada, '_id');
							}
						}
						Permiso.update({id: permiso._id}, permiso, function(npermiso){
							if ($scope.seleccionado_organica){
								permiso.jerarquiadirectaescritura = npermiso.jerarquiadirectaescritura;
								permiso.jerarquiaescritura = npermiso.jerarquiaescritura;
								$scope.setSeleccionado($scope.seleccionado);
							} else if ($scope.seleccionado_procedimiento){
								permiso.procedimientosdirectaescritura = npermiso.procedimientosdirectaescritura;
								permiso.procedimientosescritura = npermiso.procedimientosescritura;
								$scope.setProcSeleccionado($scope.procedimiento_seleccionado);
							} else if ($scope.carta_seleccionada){
								permiso.entidadobjetodirectaescritura = npermiso.entidadobjetodirectaescritura;
								permiso.entidadobjetoescritura = npermiso.entidadobjetoescritura;
								$scope.setCartaSeleccionada($scope.carta_seleccionada);
							}
						});
					};
					$scope.changeP = function(permiso) {
						permiso.grantoption = !permiso.grantoption;
						Permiso.update({id: permiso._id}, permiso);
					};

					$scope.isFiltroSelected = function(filtro, key, fa){
						return (typeof filtro[key] !== 'undefined' && fa.name === filtro[key]);
					};

					var personas_plazas_aux = PersonasSearchList.query({}, function(){
						$scope.personas_plazas = [];
						for (var i = 0; i < personas_plazas_aux.length; i++){
							$scope.personas_plazas.push(personas_plazas_aux[i].data);
						}
					});

					$scope.showPersona = function (persona){
						return (persona && persona.login && persona.nombre && persona.apellidos) ?
							(persona.login + (persona.codplaza ? ('-' + persona.codplaza) : '') + '-' + persona.nombre + ' ' + persona.apellidos) : '';
					};

					$scope.getPersona = function(permiso){
						var busqueda = '';
						var busquedabylogin = false;
						if (typeof permiso.login !== 'undefined' && permiso.login !== ''){
							busqueda = permiso.login;
							busquedabylogin = true;
						}else if (typeof permiso.codplaza !== 'undefined' && permiso.codplaza !== ''){
							busqueda = permiso.codplaza;
						} else {
							return '';
						}

						var p;

						if (typeof $scope.cachepersonas === 'undefined'){
							$scope.cachepersonas = [];
						}

						if (busqueda === null){
							return '';
						}

						if (typeof $scope.cachepersonas[busqueda] !== 'undefined') {
							p = $scope.cachepersonas[busqueda];
							$log.log('devolviendo de cache para busqueda: ' + busqueda);
						} else {
							if (busquedabylogin){
								$log.log('buscando por login: ' + busqueda);
								p = PersonasByLogin.query({'login': busqueda}, function(p){
									if (p === null || p.length) {
										$log.log('no encontrado, buscando por regex (desde login): ' + busqueda);
										$scope.cachepersonas[busqueda] = PersonasByRegexp.query({regex: busqueda}); /* <---- */
									}
								});
							} else {
								$log.log('buscando por plaza: ' + busqueda);
								p = PersonasByPuesto.query({'cod_plaza': busqueda}, function(p){
									if (p === null || p.length) {
										$log.log('no encontrado, buscando por regex (desde plaza): ' + busqueda);
										$scope.cachepersonas[busqueda] = PersonasByRegexp.query({regex: busqueda}); /* <---- */
									}
								});
							}
							$scope.cachepersonas[busqueda] = p;
						}
						return p;
					};

					$scope.getResponsable = function(procedimiento_o_carta){
						var p = [];
						// si es un procedimiento
						if (typeof procedimiento_o_carta.cod_plaza !== 'undefined' && procedimiento_o_carta.cod_plaza){
							p = PersonasByPuesto.query({'cod_plaza': procedimiento_o_carta.cod_plaza});
						// si es una entidadobjeto
						} else if (procedimiento_o_carta && typeof procedimiento_o_carta.responsable !== 'undefined' && procedimiento_o_carta.responsable ){
							$log.log('Solicitando permisos para carta con código plaza : ' + procedimiento_o_carta.responsable);
							p = PersonasByPuesto.query({'cod_plaza': procedimiento_o_carta.responsable});
						}

						return p;
					};

					$scope.setHabilitado = function(persona){
						if (!persona){
							return;
						}
						if (persona.habilitado){
							$http.post('/api/v1/restricted/habilitar/persona/' + persona._id, { habilitado: false }).then(function(){
								persona.habilitado = false;
								$rootScope.toaster('Usuario deshabilitado');
							}, function(e){
								if (typeof e.data !== 'undefined' && typeof e.data.error !== 'undefined'){
									$rootScope.toaster('Error durante la habilitación: ' + e.data.error, 'Error', 'error');
								} else {
									$rootScope.toaster('Error durante la habilitación', 'Error', 'error');
								}
							});
						} else {
							$http.post('/api/v1/restricted/habilitar/persona/' + persona._id, { habilitado: true }).then(function(){
								persona.habilitado = true;
								$rootScope.toaster('Usuario habilitado');
							}, function(e){
								if (typeof e.data !== 'undefined' && typeof e.data.error !== 'undefined'){
									$rootScope.toaster('Error durante la habilitación: ' + e.data.error, 'Error', 'error');
								} else {
									$rootScope.toaster('Error durante la habilitación', 'Error', 'error');
								}
							});
						}
					};
				}
			]
		);

})(angular);
