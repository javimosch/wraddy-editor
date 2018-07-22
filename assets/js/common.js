//||
//`

function beautifyAceEditor(editor) {
	var content = editor.session.getValue();
	editor.setValue(js_beautify(content, {
		indent_char: "\t",
		indent_size: 1
	}));
}

function httpPost(url, data){
	return new Promise((resolve, reject)=>{
		if(!data){
			data = {};
		}
		try{
			$.ajax({
	            type: 'post',
	            url: url,
	            crossDomain: true,
	            data: JSON.stringify(data),
    			contentType: 'application/json; charset=utf-8',
	            xhrFields: {
	                withCredentials: true
	            }
			}).always(function (response,status, xhr) {
				if(status=='error'){
					reject({
						message: "error",
						detail: xhr
					});
				}
				if(!response){
					return resolve(response)
				}
				if(response.err){
					reject(response.err);
				}else{
					resolve(response.result||response)
				}
			});
		}catch(err){
			reject(err)
		}
	});
}

