ajaxAPI =
{
	post: 
	{
		projects: function(form, callback, errorCallback)
		{
			ajax.post('projects', form, callback);
		},
		session: function($http, data, callback, errorCallback)
		{
            errorCallback = errorCallback ? errorCallback : function(){};

			$http.post('session', data).success(callback).error(errorCallback);
		},
		newUser: function($http, data, callback, errorCallback)
		{
            errorCallback = errorCallback ? errorCallback : function(){};

			$http.post('registration', data).success(callback).error(errorCallback);
		},
        order: function($http, data, callback, errorCallback)
        {
            $http.post('order', data).success(callback).error(errorCallback);
        }
	},
	get:
	{
		projects: function($http, callback, errorCallback)
		{
            errorCallback = errorCallback ? errorCallback : function(){};

			$http.get('projects').success(callback).error(errorCallback);
		},
		users: function($http, callback, errorCallback)
		{
            errorCallback = errorCallback ? errorCallback : function(){};

			$http.get('users').success(callback).error(errorCallback);
		}
	},
	delete:
	{
		projects: function($http, id, callback, errorCallback)
		{
            errorCallback = errorCallback ? errorCallback : function(){};

			$http.delete('projects/' + id).success(callback).error(errorCallback);
		},
		session: function($http, callback, errorCallback)
		{
            errorCallback = errorCallback ? errorCallback : function(){};

			$http.delete('session').success(callback).error(errorCallback);
		}
	},
	put:
	{
		projects: function(form, id, callback, errorCallback)
		{
            errorCallback = errorCallback ? errorCallback : function(){};

			ajax.put('projects/' + id, form, callback);
		},
		users: function($http, id, data, callback, errorCallback)
		{
            errorCallback = errorCallback ? errorCallback : function(){};

			$http.put('users/' + id, data).success(callback).error(errorCallback);
		}
	}
}