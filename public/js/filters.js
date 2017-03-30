(function(angular){
	'use strict';

	angular.module('sici.filters', []).filter('interpolate', ['version', function (version) {
		return function (text) {
			return String(text).replace(/\%VERSION\%/mg, version);
		};
	}]).filter('treatAsHTML', function () {
		return function (state) {
			return state;
		};
	}).filter('extractFromPath', function () {
		return function(value, fieldpath) {
			if (value[fieldpath]){
				return value[fieldpath];
			}
			const parts = fieldpath.split('.');

			return parts.reduce(function(prev, attr){
				return (typeof prev === 'string' || typeof prev[attr] === 'undefined') ? '' : prev[attr];
			}, value);
		};
	}).filter('numberFormat', function () {
		return function (text, sepmiles, sepdecimal, simbol) {
			if (typeof sepmiles === 'undefined'){
				sepmiles = '.';
			}
			if (typeof sepdecimal === 'undefined'){
				sepdecimal = ',';
			}
			if (typeof simbol === 'undefined'){
				simbol = '';
			}

			var num = String(text);
			var splitStr = num.split('.');
			var splitLeft = splitStr[0];
			var splitRight = splitStr.length > 1 ? sepdecimal + splitStr[1] : '';
			var regx = /(\d+)(\d{3})/;
			while (regx.test(splitLeft)) {
				splitLeft = splitLeft.replace(regx, '$1' + sepmiles + '$2');
			}

			return simbol + splitLeft + splitRight;
		};
	}).filter('pagination', function(){
		return function (input, start) {

			return input.slice(parseInt(start, 10));
		};
	}).filter('codigoDenominacion', function(){
		return function (items, value) {
			return items.filter(function(item){
				return item.codigo.indexOf(value) !== -1 || item.denominacion.toLowerCase().indexOf(value.toLowerCase()) !== -1;
			});
		};
	}).filter('sum', function(){
		return function(input){
			return angular.isObject(input) ? input.reduce(function(a, o){ return a + o; }) : input;
		};
	}).filter('join', function(){
		return function(input, joinstr){
			return angular.isObject(input) ? input.join(joinstr) : input;
		};
	}).filter('keylength', function(){
		return function(input){
			return angular.isObject(input) ? Object.keys(input).length : 0;
		};
	});
})(angular);
