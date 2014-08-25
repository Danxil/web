'use strict';

var filters = angular.module('filters', []);

filters.filter('maxSymbols', function()
{
	return function(input, maxLength)
	{
		if (input.length > maxLength)
			input = input.slice(0, maxLength) + '...';
		
		return input;
	};
});

filters.filter('reverse', function()
{
	return function(input)
	{
		return input.slice().reverse();
	};
});

filters.filter('pagination', function()
{
	return function(input, start, max)
	{
		return input.slice(start, max);
	};
});

filters.filter('fixedNumber', function()
{
	return function(emptyArray, number) {
		return Array(number);
	}
});