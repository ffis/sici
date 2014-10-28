function RecalculateCtrl($rootScope,$scope,$window, $http){
    $rootScope.nav = 'recalculate';
    $scope.actualizando = 0;
    $window.document.title ='SICI';
    $scope.respuestas = [];
    $scope.recalcularjerarquia = function(){
    	$scope.respuestas.push({
    		clase:'alert-success',
    		mensaje : 'Ha funcionado perfectamente.'
    	});
    }
}

RecalculateCtrl.$inject =  ['$rootScope','$scope','$window', '$http'];