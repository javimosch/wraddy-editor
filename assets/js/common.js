//||
//`
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

