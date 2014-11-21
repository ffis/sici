'use strict';

/* Filters */

angular.module('sici.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }])
	.filter('treatAsHTML', function ($sce) {
        return function (state) {
        	return state;
        }
	})
  .filter('extractFromPath', function ($sce) {
        return function (value, fieldpath) {
          if (value[fieldpath])
            return value[fieldpath];

          var parts = fieldpath.split('.');
          for (var i=0,j=parts.length;i<j;i++){
            if (typeof value[parts[i]] != 'undefined')
            {
              value = value[parts[i]];
            }else{
              return '';
            }
            
          }
          return value;
        }
  })
  .filter('numberFormat',function(){
  		return function(text, sepmiles,sepdecimal,simbol){
  			if (typeof sepmiles=== 'undefined') sepmiles = '.';
  			if (typeof sepdecimal=== 'undefined') sepdecimal = ',';
  			if (typeof simbol=== 'undefined') simbol = '';

  			var num = String(text);
			var splitStr = num.split('.');
			var splitLeft = splitStr[0];
			var splitRight = splitStr.length > 1 ? sepdecimal + splitStr[1] : '';
			var regx = /(\d+)(\d{3})/;
			while (regx.test(splitLeft)) {
				splitLeft = splitLeft.replace(regx, '$1' + sepmiles + '$2');
			}
		  	return simbol + splitLeft  +splitRight;
   		}
  })
  .filter('pagination', function()
  {
    return function(input, start) {
      start = parseInt(start, 10);
      return input.slice(start);
    };
  });
  
