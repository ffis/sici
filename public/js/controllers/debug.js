function DebugCtrl ($rootScope, $scope) {

	$scope.mensajesdebug = [];
	$scope.itemsPerPage = 15;
	$scope.orderby = 'id';
	$scope.reverse = true;


 	$scope.currentPage = 0;
 	$scope.range = function() {
		var rangeSize = 5;
		var ps = [];
		var start;
		start = $scope.currentPage;
		if ( start > $scope.pageCount()-rangeSize ) {
			start = $scope.pageCount()-rangeSize+1;
		}
		if (start>1){ rangeSize--; ps.push(start-2);	}
		if (start>0){ rangeSize--; ps.push(start-1);	}
		for (var i=start; i<start+rangeSize; i++) {
			if(i>=0) 
				ps.push(i);
		}
		return ps;
	};

	$scope.prevPage = function() {
		if ($scope.currentPage > 0) {
			$scope.currentPage--;
		}
	};
	$scope.DisablePrevPage = function() {
		return $scope.currentPage === 0 ? "disabled" : "";
	};
	$scope.pageCount = function() {
		return Math.ceil($scope.mensajesdebug.length/$scope.itemsPerPage)-1;
	};
	$scope.nextPage = function() {
		if ($scope.currentPage < $scope.pageCount()) {
			$scope.currentPage++;
		}
	};
	$scope.DisableNextPage = function() {
		return $scope.currentPage === $scope.pageCount() ? "disabled" : "";
	};
	$scope.setPage = function(n) {
		$scope.currentPage = n;
	};

	$scope.MAX = 1000;
	$scope.pushNewMessage = function(message){
		$scope.mensajesdebug.push(message);
		if ($scope.mensajesdebug.length>$scope.MAX)
			$scope.mensajesdebug.shift();
		$scope.$digest();
	};

 	var socket = io.connect();
 	socket.on('log',function(message){
 		var date = new Date(Date.parse(message.time)).toLocaleString().split(' ');
 		message.date = date[0];
 		message.time = date[1];
 		message.clase = 'warning';
		$scope.pushNewMessage(message);
 	})
 	socket.on('error',function(message){
 		var date = new Date(Date.parse(message.time)).toLocaleString().split(' ');
 		message.date = date[0];
 		message.time = date[1];
 		message.clase = 'danger';
		$scope.pushNewMessage(message);
 	})
 	socket.on('info',function(message){
 		var date = new Date(Date.parse(message.time)).toLocaleString().split(' ');
 		message.date = date[0];
 		message.time = date[1];
 		message.clase = 'info';
		$scope.pushNewMessage(message);
 	})

 	$scope.$on('$destroy',function(){
		socket.disconnect();
 	});
}

DebugCtrl.$inject = ['$rootScope','$scope'];
