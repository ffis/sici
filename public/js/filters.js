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

  ;
