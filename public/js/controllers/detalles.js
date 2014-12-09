function DetallesCtrl($q, $rootScope, $scope, $routeParams, $window, $location, $timeout, $http, Procedimiento, DetalleCarmProcedimiento, DetalleCarmProcedimiento2, Raw, Aggregate, Arbol, ProcedimientoHasChildren, ProcedimientoList) {

    $scope.detallesCarm = DetalleCarmProcedimiento.get({codigo: $routeParams.codigo});
    $scope.detallesCarm2 = DetalleCarmProcedimiento2.get({codigo: $routeParams.codigo});
    $scope.numgraphs = 0;
    $scope.graficasbarras = false;
    $scope.mesActual = (new Date()).getMonth();
    $scope.detallesCarmHTML = true;
    $scope.graphs = false;
    $scope.padre = "";
    $scope.mostrarAutocompletePadre = false;
    $scope.nombrePadre = false;


    $scope.nextYear = function () {
        $scope.anualidad = 'a' + (parseInt($scope.anualidad.substring(1, 5)) + 1);
    };

    $scope.prevYear = function () {
        $scope.anualidad = 'a' + (parseInt($scope.anualidad.substring(1, 5)) - 1);
    };

    $scope.exists = function (attr) {
        if ($scope.anualidad) {
            return $scope.procedimientoSeleccionado.periodos[$scope.anualidad] &&
                    typeof $scope.procedimientoSeleccionado.periodos[$scope.anualidad][attr] != 'undefined';
        }
    };

    $scope.getNext = function () {
        if ($scope.anualidad) {
            return "" + (parseInt("" + $scope.anualidad.substring(1, 5)) + 1);
        }
    };

    $scope.showProcedimiento = function (procedimiento) {
        if (procedimiento && procedimiento.denominacion && procedimiento.codigo)
            return "[" + procedimiento.codigo + "] " + procedimiento.denominacion;
        else
            return "";
    };

    $scope.updatePadre = function (value) {
        $scope.procedimientoSeleccionado.padre = value.codigo;
        $scope.nombrePadre = value.denominacion;
        $scope.procedimientoSeleccionado.$update(function (response) {
            
        });
        $scope.mostrarAutocompletePadre = false;
    };

    $scope.getPrev = function () {
        if ($scope.anualidad) {
            return "" + (parseInt("" + $scope.anualidad.substring(1, 5)) - 1);
        }
    };

    $scope.ocultarProcedimiento = function (procedimientoSeleccionado) {
        procedimientoSeleccionado.oculto = !procedimientoSeleccionado.oculto;
        $scope.procedimientoSeleccionado.$update(function (response) {
            $scope.respuesta = {
                clase: 'alert-success',
                mensaje: (procedimientoSeleccionado.oculto ? 'El procedimiento ha sido ocultado' : 'El procedimiento vuelve a ser visible')
            };
        }, function () {
            $scope.respuesta = {
                clase: 'alert-danger',
                mensaje: 'Se ha producido un error'
            };
        });
    };

    $scope.eliminarProcedimiento = function (procedimientoSeleccionado) {
        procedimientoSeleccionado.eliminado = true;
        $scope.procedimientoSeleccionado.$delete(function (response) {
            $scope.respuesta = {
                clase: 'alert-success',
                mensaje: (procedimientoSeleccionado.eliminado ? 'El procedimiento ha sido eliminado' : 'El procedimiento ha sido recuperado')
            };
        }, function () {
            procedimientoSeleccionado.eliminado = !procedimientoSeleccionado.eliminado;
            $scope.respuesta = {
                clase: 'alert-danger',
                mensaje: 'Se ha producido un error'
            };
        });
    };

    $scope.editarPadre = function () {
        $scope.mostrarAutocompletePadre = true;
    };

    $scope.deletePadre = function () {
        $scope.procedimientoSeleccionado.padre = null;
        $scope.procedimientoSeleccionado.$update(function (response) {
            console.error(response);
        });
        $scope.nombrePadre = 'Sin definir';
    };

    $scope.procedimientoSeleccionado = Procedimiento.get({codigo: $routeParams.codigo}, function () {
        $window.document.title = 'SICI: ' + $scope.procedimientoSeleccionado.denominacion;
        $rootScope.procedimiento = $scope.procedimientoSeleccionado.codigo;
        $scope.anualidad = '000000';

        ProcedimientoHasChildren.query({'codigo': $scope.procedimientoSeleccionado.codigo}, function (data) {
            $scope.tiene_hijos = data.count;
        });

        $scope.procedimientosPadre = ProcedimientoList.query({'idjerarquia': $scope.procedimientoSeleccionado.idjerarquia, 'recursivo': false});

        $scope.mostrarAutocompletePadre = false;
        if ($scope.procedimientoSeleccionado.padre) {
            var procPad = Procedimiento.get({codigo: $scope.procedimientoSeleccionado.padre}, function () {
                $scope.nombrePadre = procPad.denominacion;
            });
        } else {
            $scope.nombrePadre = 'Sin definir';
        }

        for (var anualidad in $scope.procedimientoSeleccionado.periodos) {
            console.log(anualidad);
            if (parseInt(anualidad.substring(1, 5)) > parseInt($scope.anualidad.substring(1, 5)))
                $scope.anualidad = anualidad;
        }
        if ($scope.procedimientoSeleccionado.ancestros && $scope.procedimientoSeleccionado.ancestros[0].id == 1)
        {
            $scope.procedimientoSeleccionado.ancestros.reverse();//TODO: revisar este parche
        }

        var dW = $q.defer();
        $rootScope.W($scope.procedimientoSeleccionado).then(function (val) {
            $rootScope.superuser().then(function (val2) {
                dW.resolve(val || val2);
            }, function (err) {
                dW.reject(err);
            });
        }, function (err) {
            dW.reject(err);
        });

        $scope.W = dW.promise;//$rootScope.W($scope.procedimientoSeleccionado) || $rootScope.superuser();
        $scope.superuser = $rootScope.superuser();

        var cod_plaza = $scope.procedimientoSeleccionado.cod_plaza;
        var graphskeys = [
            {caption: 'RESUMEN DE DATOS DE GESTIÓN ' + $scope.anualidad.substring(1, 5), keys: [
                    {caption: 'Solicitados', vals: 'periodos.' + $scope.anualidad + '.solicitados', maxx: $scope.mesActual},
                    {caption: 'Iniciados', vals: 'periodos.' + $scope.anualidad + '.iniciados', maxx: $scope.mesActual},
                    {caption: 'Pendientes', vals: 'periodos.' + $scope.anualidad + '.pendientes', maxx: $scope.mesActual},
                    {caption: 'Total resueltos', vals: 'periodos.' + $scope.anualidad + '.total_resueltos', maxx: $scope.mesActual},
                    {caption: 'Total resueltos ' + ($scope.anualidad - 1), vals: 'periodos.a' + ($scope.anualidad - 1) + '.total_resueltos', maxx: 12},
                ]},
            {caption: 'RESUELTOS EN PLAZO ' + $scope.anualidad.substring(1, 5), keys: [
                    {caption: 'En plazo', vals: 'periodos.' + $scope.anualidad + '.en_plazo', maxx: $scope.mesActual},
                    {caption: 'Fuera de plazo', vals: 'periodos.' + $scope.anualidad + '.fuera_plazo', maxx: $scope.mesActual},
                ]},
            {caption: 'DESESTIMIENTOS/RENUNCIAS Y PRESCRITOS/CADUCADOS ' + $scope.anualidad.substring(1, 5), keys: [
                    {caption: 'Resueltos por Desistimiento/Renuncia/Caducidad (Resp_Ciudadano)', vals: 'periodos.' + $scope.anualidad + '.resueltos_desistimiento_renuncia_caducidad', maxx: $scope.mesActual},
                    {caption: 'Resueltos por Prescripcion/Caducidad (Resp_Admon)', vals: 'periodos.' + $scope.anualidad + '.resueltos_prescripcion', maxx: $scope.mesActual},
                ]},
            {caption: 'QUEJAS Y RECURSOS CONTRA EL PROCEDIMIENTO ' + $scope.anualidad.substring(1, 5), keys: [
                    {caption: 'Quejas presentadas en el mes', vals: 'periodos.' + $scope.anualidad + '.quejas', maxx: $scope.mesActual},
                    {caption: 'Recursos presentados en el mes', vals: 'periodos.' + $scope.anualidad + '.recursos', maxx: $scope.mesActual},
                ]}
        ];
        $scope.graphskeys = graphskeys;
        $scope.graphs = [];
        $scope.numgraphs = 0;
        graphskeys.forEach(function (g, i) {
            var maxvalue = 0;
            var data = [];
            var caption = g.caption;
            g.keys.forEach(function (key, indx) {
                var k = $scope.procedimientoSeleccionado;
                var values = [];
                var indexes = key.vals.split('.');
                for (var j in indexes) {
                    var index = indexes[j];
                    if (typeof k[index] == 'undefined')
                        break;
                    k = k[index];
                }
                if (typeof k != 'undefined' && k.length > 0) {
                    k.forEach(function (val, idx) {
                        /*try{
                         console.log(idx +':'+graphskeys[i].keys[indx].maxx);
                         }catch(e){
                         console.error(i+':'+indx);
                         }*/
                        if (idx < graphskeys[i].keys[indx].maxx) {
                            values.push([idx, val]);
                            if (maxvalue < val)
                                maxvalue = val;
                        }
                    });
                    data.push({"key": key.caption, "values": values});
                } else {
                    console.log('Index malo:' + indexes);
                }
            });
            var forcey = [0, Math.ceil(maxvalue * 1.3)];
            if (maxvalue > 0) {
                $scope.graphs.push({data: data, forcey: forcey, caption: caption});
                $scope.numgraphs = $scope.numgraphs + 1;
            }
        });

        $scope.inconsistencias = Raw.query({model: 'reglasinconsistencias'}, function () {
            $scope.inconsistencias.forEach(function (i, idx) {
                var campo = {'codigo': '$codigo'};
                try {
                    var restriccion = JSON.parse(i.restriccion);
                    restriccion.codigo = $scope.procedimientoSeleccionado.codigo;
                    $scope.inconsistencias[idx].datos = Aggregate.query({campo: JSON.stringify(campo), restriccion: JSON.stringify(restriccion)});
                } catch (exception) {
                    console.error('La restricción ' + i.restriccion + ' no es correcta');
                }
            });
        });
        
        $scope.changeFocus = function(form, index, attr) {
            form.$submit();
            var formulario;
            if (index>=11) {
                formulario = $scope.forms[0][$scope.attrstabla[$scope.attrstabla.indexOf(attr)+1]];
            }
            else 
                formulario = $scope.forms[index+1][attr];
            if (typeof formulario !== 'undefined') 
                formulario.$show();
        };

        $scope.forms = [];
        $scope.addForm = function(attr, index, form) {
            if(typeof $scope.forms[index] === 'undefined')
                $scope.forms[index]={};
            $scope.forms[index][attr]=form;
        };

        /***** CAMBIO DE JERARQUIA ****/

        var defjerarquia = $q.defer();
        $scope.pjerarquia = defjerarquia.promise;
        $rootScope.jerarquialectura().then(function (j) {
            $rootScope.jerarquiaescritura().then(function (j2) {
                $scope.jerarquia = j.concat(j2);
                defjerarquia.resolve($scope.jerarquia);
            });
        });

        /*$scope.filtrojerarquia*/
        $scope.fj = function (item) {
            if ($scope.jerarquia.indexOf(item.id) != -1)
                return true;
            if (item.nodes) {
                for (var i = 0; i < item.nodes.length; i++)
                    if ($scope.filtrojerarquia(item.nodes[i]))
                        return true;
            }
            return false;
        };


        $scope.filtrojerarquia = function (item) {
            var def = $q.defer();
            $scope.pjerarquia.then(function () {
                def.resolve($scope.fj(item));
                $scope.filtrojerarquia = $scope.fj;
            }, function (err) {
                def.reject(err);
            });
            return def.promise;
        }


        $scope.filtrosocultos = false;
        $scope.seleccinado = null;
        $scope.mensaje_moviendo = '';
        $scope.msj_base = 'Moviendo (Esta operación puede tardar un tiempo)...';


        $scope.setSeleccionado = function (elemento) {
            $scope.seleccionado = elemento;
            $timeout($scope.gotOkCancel, 500);
        }

        $rootScope.superuser().then(function () {
            console.log('Obteniendo arbol para funcionalidad cambio de jerarquia');
            $scope.arbol = Arbol.query();
        });

        $scope.execCmd = function (cmds, i) {
            cmds[i - 1].defer.promise.then(function () {
                $scope.mensaje_moviendo = $scope.msj_base + cmds[i].msj;
                $http.get(cmds[i].cmd).then(function () {
                    $scope.mensaje_moviendo = $scope.mensaje_moviendo + " OK¡";
                    cmds[i].defer.resolve({'index': i, 'msj': 'Comando ' + cmds[i].cmd + ' OK'});
                }, function () {
                    cmds[i].defer.reject('Error al solicitar un recalculo ' + i);
                });
            }, function () {
                cmds[i].defer.reject('No se ha ejecutado el comando previo ' + i);
            })
            return cmds[i].defer.promise;
        };

        $scope.changeOrganica = function () {
            // cambiamos idjerarquia.
            $scope.procedimientoSeleccionado.idjerarquia = $scope.seleccionado.id;
            console.log('Salvando ');
            console.log($scope.procedimientoSeleccionado);
            $scope.procedimientoSeleccionado.$update(function (response) {
                console.log(response);
                // salvamos y ordenamos el recalculo.
                var cmds = [
                    {cmd: '', defer: $q.defer()},
                    {cmd: '/api/fprocedimiento', defer: $q.defer(), msj: 'Ajustando procedimiento'},
                    {cmd: '/api/fjerarquia', defer: $q.defer(), msj: 'Ajustando organica'},
                    {cmd: '/api/fpermiso', defer: $q.defer(), msj: 'Comprobando permisos'}
                ];
                cmds[0].defer.resolve();
                $scope.mensaje_moviendo = $scope.msj_base;
                for (var i = 1; i < cmds.length; i++) {
                    $scope.execCmd(cmds, i).then(function (data) {
                        console.log(data.msj);
                        if (data.index == cmds.length - 1) {
                            $scope.mensaje_moviendo = $scope.msj_base + ' ¡¡Listo!!';
                            $timeout($scope.cancelChangeOrganica, 1500);
                        } else {
                            $scope.mensaje_moviendo = $scope.mensaje_moviendo + '.';
                        }

                    }, function (err) {
                        $scope.mensaje_moviendo = 'Error. Ocurrió un error realizando la operación. Si es posible ejecute manualmente las operaciones de mantenimiento y recálculo. ';
                        console.log(err);
                    });
                }
                $scope.recalculate();
            });
        };

        $scope.gotoBreadCrumb = function () {
            //$location.hash('breadcrumb');	
        };

        $scope.gotOkCancel = function () {
            //$location.hash('ok_cancel_changeOrganica');
        };

        $scope.cancelChangeOrganica = function () {
            $scope.seleccinado = null;
            $scope.showArbol = false;
            $scope.mensaje_moviendo = '';
            $timeout($scope.gotoBreadCrumb, 1000);
        };

        $scope.setShowArbol = function () {
            $scope.showArbol = true;
        }

        $scope.isShowArbol = function () {
            return $scope.showArbol;
        }
        /******************************/



    });
    $scope.attrspar = [
        'codigo', 'denominacion', 'tipo', 'cod_plaza', 'fecha_creacion', 'fecha_version' /* 'fecha_fin', */
    ];

    $scope.attrsanualidad = ['pendientes_iniciales', /*'periodoscerrados',*/
        'plazo_CS_ANS_habiles', 'plazo_CS_ANS_naturales', 'plazo_maximo_resolver', 'plazo_maximo_responder'];
    $scope.attrsanualidad_permisos = ['w', 's', 'w', 'w', 'w', 'w'];

    $scope.attrstabla = [
        'solicitados',
        'iniciados',
        'quejas', 'recursos',
        'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
        'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion',
        'en_plazo',
        't_medio_habiles', 't_medio_naturales',
    ];
    /* 'totalsolicitudes', */
    $scope.attrstablacalculados = ['total_resueltos', 'fuera_plazo', 'pendientes'];
    $scope.attrsresp = ['codplaza', 'login', 'nombre', 'apellidos', 'telefono'];

    $scope.meses = $rootScope.meses;
    $scope.colorText = $rootScope.colorText;

    $scope.graficasgrandes = false;
    $scope.xAxisTickValuesFunction = function () {
        return function (d) {
            return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        };
    };
    $scope.xAxisTickFormatFunction = function () {
        return function (d) {
            return $scope.meses[d];
        }
    };
    $scope.colorFunction2 = function () {
        return function (d, i) {
            return $rootScope.colorToHex($rootScope.colorText(i, 5, 60));
        }
    };
    var colorCategory = d3.scale.category20b()
    $scope.colorFunction = function () {
        return function (d, i) {
            return colorCategory(i);
        };
    };

    $scope.recalculate = function (force) {
		if (force || $scope.cellChanged) {
			$scope.procedimientoSeleccionado.$update(function (response) {
				console.error(response);
			});
		}
    }
    $scope.checkNumber = function (data, anualidad, attr, index) {
		if (procedimientoSeleccionado.periodos[anualidad][attr][index]!=data)
			$scope.cellChanged = true;
		else
			$scope.cellChanged = false;
			
        var valor = parseInt(data);
        if (isNaN(valor) || !/^\d+$/.test(data)) {
            return "Esto no es un número";
        } else if (valor < 0) {
            return "No se admiten valores menores de 0";
        }
    };


}
DetallesCtrl.$inject = ['$q', '$rootScope', '$scope', '$routeParams', '$window', '$location', '$timeout', '$http', 'Procedimiento', 'DetalleCarmProcedimiento', 'DetalleCarmProcedimiento2', 'Raw', 'Aggregate', 'Arbol', 'ProcedimientoHasChildren', 'ProcedimientoList'];

function parseStr2Int(str) {
    var valor = parseInt(str);
    if (isNaN(valor) || !/^\d+$/.test(data))
        valor = 0;
    return valor;
}
