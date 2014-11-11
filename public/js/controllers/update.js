function UpdateCtrl($rootScope,$scope,$window,$upload,Importacion){
    $rootScope.nav = 'update';
    $scope.actualizando = 0;
    $window.document.title ='SICI - Importación';
    $scope.respuestas= Importacion.query();

    $scope.remove = function(respuesta){
    	if (confirm('¿Está seguro de querer borrar esta importación? Esta operación no es reversible.'))
		respuesta.$delete(function(){
			$scope.respuestas= Importacion.query();
		});
    }

    $scope.confirm = function(respuesta){
        if (confirm('¿Está seguro de querer aplicar esta importación? Esta operación no es reversible.'))
			respuesta.$save(function(){
				$scope.respuestas= Importacion.query();
			});
    }


    $scope.onFileSelect = function($files) {
    //$files: an array of files selected, each file has name, size, and type.
	    for (var i = 0; i < $files.length; i++) {
	      var file = $files[i];
	      $scope.actualizando++;
	      $scope.upload = $upload.upload({
	        url: '/api/updateByFile', 
	        //method: 'POST' or 'PUT',
	        //headers: {'header-key': 'header-value'},
	        //withCredentials: true,
	        data: {myObj: 'datoenviadodesdeelcliente'},
	        file: file, // or list of files ($files) for html5 only
	        //fileName: 'doc.jpg' or ['1.jpg', '2.jpg', ...] // to modify the name of the file(s)
	        // customize file formData name ('Content-Desposition'), server side file variable name. 
	        //fileFormDataName: myFile, //or a list of names for multiple files (html5). Default is 'file' 
	        // customize how data is added to formData. See #40#issuecomment-28612000 for sample code
	        //formDataAppender: function(formData, key, val){}
	      }).progress(function(evt) {
	        console.log('percent: ' + parseInt(100.0 * evt.loaded / evt.total));

	      }).success(function(data, status, headers, config) {
	        // file is uploaded successfully
	        console.log('Del servidor al cliente:'+data);
	        $scope.actualizando--;
	        $scope.respuestas.push(data)
	      })/*.fail(function(){
	      	console.error('fallo');
	      	$scope.actualizando--;
	      });*/
		}
	}
}

UpdateCtrl.$inject =  ['$rootScope','$scope','$window','$upload','Importacion'];