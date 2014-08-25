var ajax =
{
	callbacks: {},
	post: function(url, form, callback)
	{
		if (!ajax.frame)
		{
			ajax.frame = document.createElement('iframe');
			
			ajax.frame.name = 'ajaxMultipartFrame';
			
			ajax.frame.setAttribute('hidden', '');
			
			document.body.appendChild(ajax.frame);
		}
		
		ajax.frame.onload = function()
		{	var pre = frames['ajaxMultipartFrame'].document.body.getElementsByTagName('pre')[0];
		
			if (!pre)
				return;
			
			var response = pre.innerHTML;
			
			if (response.indexOf('{') != -1)
				callback(JSON.parse(response));
			else
				if (response == 'OK')
					callback({});
		}
		
		form.enctype = 'multipart/form-data';
		form.target = 'ajaxMultipartFrame';
		form.method = 'POST';
		form.action = url;
		
		form.submit();
	},
	put: function(url, form, callback)
	{
		if (!ajax.frame)
		{
			ajax.frame = document.createElement('iframe');
			
			ajax.frame.name = 'ajaxMultipartFrame';
			
			ajax.frame.setAttribute('hidden', '');
			
			document.body.appendChild(ajax.frame);
		}
		
		ajax.input = document.querySelector('input[name="_method"]');
		
		ajax.frame.onload = function()
		{	var pre = frames['ajaxMultipartFrame'].document.body.getElementsByTagName('pre')[0];
		
			if (!pre)
				return;
			
			var response = pre.innerHTML;
			
			if (response.indexOf('{') != -1)
				callback(JSON.parse(response));
			else
				if (response == 'OK')
					callback({});
		}
		
		if (!ajax.input)
		{
			ajax.input = document.createElement('input');
			
			ajax.input.setAttribute('hidden', '');
			ajax.input.setAttribute('name', '_method');
			
			form.appendChild(ajax.input);
		}
		
		ajax.input.setAttribute('value', 'PUT');
		
		form.enctype = 'multipart/form-data';
		form.target = 'ajaxMultipartFrame';
		form.method = 'POST';
		form.action = url;
		
		form.submit();
	}
}