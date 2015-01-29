function InformesCtrl($rootScope, $scope, $window, $http, $timeout, ExportarInforme, PeriodosStats, Arbol) {
    $rootScope.nav = 'recalculate';
    $scope.actualizando = 0;
    $window.document.title = 'SICI';
    $scope.respuestas = [];
    $scope.anyos = [];
    $scope.funcionalidades = [
        {label: 'Informe global', selectanyo:true, fn: [{label: "Descargar Excel", cmd: 'descargarexcel', anyo: true}]},
        {label: 'Informe resumen', selectanyo:false, fn: [{label: "Generar Resumen", cmd: 'periodosStats', anyo: true}]}
    ];
    
    var maxAnyo = new Date().getFullYear();

    for(var anyo=2014; anyo <= maxAnyo; anyo++){
        $scope.anyos.push( {code: 'a'+anyo, name: ''+anyo});
    }
    
    $scope.clasefuncionalidades = 'col-md-' + (12 / $scope.funcionalidades.length).toFixed(0);
    $scope.anyoSelected = $scope.anyos[ $scope.anyos.length -1 ];

    $scope.invoke = function (cmd) {
        if ($scope.actualizando) {
            alert('Espere a que termine la actualización previa');
            return;
        }
        $scope.actualizando++;
        switch(cmd){
            case 'descargarexcel':
                if (!$scope.anyoSelected || !$scope.anyoSelected.code || $scope.anyoSelected.code === '') {
                    $scope.actualizando--;
                    $scope.respuestas.push({
                        clase: 'alert-warning', mensaje: 'Debe seleccionar un año.'
                    });
                    return;
                }
                ExportarInforme.get({year: $scope.anyoSelected.code}, function (token) {
                    $scope.actualizando--;
                    $scope.respuestas.push({
                        clase: 'alert-success', mensaje: 'Ha funcionado perfectamente.'
                    });
                    var url = '/download/' + token.time + '/' + token.hash;
                    $window.location = url;
                }, function() {
                    $scope.actualizando--;
                    $scope.respuestas.push({
                        clase: 'alert-warning', mensaje: 'Error al descargar el informe.'
                    });
                });
            break;
            case 'periodosStats':
                $scope.arbol = Arbol.query();
                $scope.stats = PeriodosStats.query(function(){$scope.actualizando--;});
            break;
        }
    };
    $scope.setSeleccionado = function(seleccionad){
        if (seleccionad) {
            $scope.seleccionado = seleccionad;
            $rootScope.setTitle(seleccionad.title); 
            $scope.cumplimentados = 0;
            $scope.count = 1;
            $timeout(function(){
                $("body").animate({scrollTop: $('#detallesjerarquia').offset().top}, "slow");
            }, 20);
        }
    };
    $scope.detallado = false;
    $scope.setDetallado = function( detallad){
        if (detallad){
            if ($scope.detallado && detallad.id == $scope.detallado.id)
            {
                $scope.detallado = false;
            }else{
                $scope.detallado = detallad;
                $timeout(function(){
                    $("body").animate({scrollTop: $('#detallesNodo').offset().top}, "slow");
                }, 20);
            }
        }
    }

    var cached = null;
     $scope.fnGetStatsNode = function(nodoid, anualidad){
        if (cached && cached._id && cached._id.idjerarquia==nodoid && cached._id.anualidad==anualidad){
            return cached;
        }
        for(var i=0, j= $scope.stats.length; i<j; i++){
            if ($scope.stats[i]._id.idjerarquia==nodoid && $scope.stats[i]._id.anualidad==anualidad){
                cached = $scope.stats[i];
                return cached;
            }
        }
        return null;
    }
    $scope.getTotales = function(nodoid, anualidad, campo){
        var nodo =  $scope.fnGetStatsNode(nodoid, anualidad);
        if (!nodo) return '';
        if (!nodo.value[campo]) return '0';
        return nodo.value[campo].reduce(function(prev, current){ return prev+current; },0);
    };
    $scope.mutextoculto = function(){ $scope.oculto= !$scope.oculto;}
    $scope.mostrarcolumnasocultas =  function(){ $scope.columnasocultas= !$scope.columnasocultas;}
    $scope.oculto= false;
    $scope.columnasocultas = true;
    $scope.campos = [
            //'t_medio_habiles', 't_medio_naturales',
            'en_plazo', 'fuera_plazo', 
            'resueltos_desistimiento_renuncia_caducidad', 'resueltos_prescripcion',
            'resueltos_1', 'resueltos_5', 'resueltos_10', 'resueltos_15', 'resueltos_30', 'resueltos_45', 'resueltos_mas_45',
            'quejas', 'recursos'
        ];

}

InformesCtrl.$inject = ['$rootScope', '$scope', '$window', '$http', '$timeout', 'ExportarInforme', 'PeriodosStats', 'Arbol'];