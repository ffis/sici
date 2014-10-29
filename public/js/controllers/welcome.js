
function WelcomeCtrl($rootScope,$scope,$window,Aggregate){
    $rootScope.nav = 'inicio';
    $window.document.title ='SICI';
    $scope.colorText = function(i, numcolors, phase)
        {
            if (phase == undefined) phase = 0;
            center = 128;
            width = 127;
            frequency = Math.PI*2/numcolors;
            
            return {
                red   : Math.ceil(Math.sin(frequency*i+2+phase) * width + center),
                green : Math.ceil(Math.sin(frequency*i+0+phase) * width + center),
                blue  : Math.ceil(Math.sin(frequency*i+4+phase) * width + center)
            };
        };
    
    $scope.percent = [];
    $scope.options = []

    $scope.decimalToHex = function(d) {
      var hex = Number(d).toString(16);
      hex = "00".substr(0, 2 - hex.length) + hex; 
      return hex;
    }

    $scope.meses = $rootScope.meses;
    $scope.meses.forEach(function(m,idx){
        $scope.percent.push(Math.floor((Math.random() * 80) + 21));
        var color = $scope.colorText(idx,12,60);
        var col = '#'+$scope.decimalToHex(color.red)+$scope.decimalToHex(color.green)+$scope.decimalToHex(color.blue);
        $scope.options.push({
            animate:{
                duration:1000,
                enabled:true
            },
            barColor:col,
            scaleColor:false,
            lineWidth:3,
            lineCap:'circle'
        });
    });
    $scope.indicadores = [
        {bg:'red-soft',descripcion:'Solicitudes',number:255,icon:'fa-folder-open'},
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
                restriccion: "{\"periodos."+$scope.anyoActual+".totalsolicitudes\":{\"$lt\":1}}"
            });
    $scope.inconsistencias =
            Aggregate.query({
                campo: JSON.stringify({'codigo':'$codigo','denominacion':'$denominacion'}),
                restriccion: "{\"periodos."+$scope.anyoActual+".pendientes\":{\"$lt\":0}}"
            });
}

WelcomeCtrl.$inject =  ['$rootScope','$scope','$window','Aggregate'];