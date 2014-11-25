

function WelcomeCtrl($rootScope,$scope,$window,Aggregate,ProcedimientoCount,TramitesCount,PorcentajeTramitesResultos,ProcedimientosSinExpedientes){
    $rootScope.nav = 'inicio';
    $window.document.title ='SICI - Portada';
    
    $scope.percent = [];
    $scope.options = [];

    $scope.meses = $rootScope.meses;
    $scope.meses.forEach(function(m,idx){
        $scope.percent.push(Math.floor((Math.random() * 80) + 21));
        var color = $rootScope.colorToHex( $rootScope.colorText(idx,$scope.meses.length,60) );
        $scope.options.push({
            animate:{
                duration:1000,
                enabled:true
            },
            barColor:color,
            scaleColor:false,
            lineWidth:3,
            lineCap:'circle'
        });
    });
    $scope.indicadores = [
        //{bg:'red-soft',descripcion:'Trámites',number:368,icon:'fa-folder-open'},
        //{bg:'purple-soft',descripcion:'Tiempo medio',number:'3 días',icon:'fa-bar-chart'}
        //{bg:'blue-soft',descripcion:'Cumplimiento',number:'98%',icon:'fa-bar-chart'},
    ];
    $scope.procedimientos = ProcedimientoCount.get(function(){
        $scope.indicadores.push( {bg:'red-soft',descripcion:'Procedimientos',number:$scope.procedimientos.count,icon:'fa-folder-open'});
    });
    $scope.tramites = TramitesCount.get(function(){
        $scope.indicadores.push( {bg:'green-soft',descripcion:'Expedientes',number:$scope.tramites.suma,icon:'fa-comments'});
    });
    $scope.ratio= PorcentajeTramitesResultos.get(function(){
        $scope.indicadores.push( {bg:'blue-soft',descripcion:'Cumplimiento',number:($scope.ratio.ratio*100)+'%',icon:'fa-pie-chart'});
    });
    $scope.sinexpediente= ProcedimientosSinExpedientes.get(function(){
        $scope.indicadores.push( {bg:'purple-soft',descripcion:'Procedimientos sin expedientes',number:$scope.sinexpediente.total,icon:'fa-bar-chart'});
    });
    var date = (new Date());
    $scope.mesActual  = date.getMonth();
    $scope.anyoActual = date.getFullYear();
    $scope.pendientes =
        Aggregate.query({
            campo: JSON.stringify({'codigo':'$codigo','denominacion':'$denominacion'}),
            restriccion: "{\"periodos.a"+$scope.anyoActual+".totalsolicitudes\":{\"$lt\":1}}"
    });
    $scope.inconsistencias =
        Aggregate.query({
            campo: JSON.stringify({'codigo':'$codigo','denominacion':'$denominacion'}),
            restriccion: "{\"periodos.a"+$scope.anyoActual+".pendientes\":{\"$lt\":0}}"
    });
}

WelcomeCtrl.$inject =  ['$rootScope','$scope','$window','Aggregate','ProcedimientoCount', 'TramitesCount', 'PorcentajeTramitesResultos', 'ProcedimientosSinExpedientes'];
