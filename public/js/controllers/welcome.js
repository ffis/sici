
function WelcomeCtrl($rootScope, $scope, $window, Aggregate){
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
        {bg:'red-soft',descripcion:'Procedimientos',number:255,icon:'fa-folder-open'},
        {bg:'green-soft',descripcion:'Trámites',number:349,icon:'fa-comments'},
        {bg:'purple-soft',descripcion:'Tiempo medio',number:'3 días',icon:'fa-pie-chart'},
        {bg:'blue-soft',descripcion:'Cumplimiento',number:'98%',icon:'fa-bar-chart'},
    ];
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

WelcomeCtrl.$inject =  ['$rootScope','$scope','$window','Aggregate'];