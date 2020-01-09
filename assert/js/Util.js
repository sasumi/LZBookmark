class Util {
	static EMPTY_FN = ()=>{};

	static arrayWalkRecursive = (arr, callback, _level = 0, childrenKey = 'children') => {
		arr.forEach((item) => {
			callback(item, _level);
			if(item[childrenKey]){
				Util.arrayWalkRecursive(item[childrenKey], callback, _level + 1, childrenKey);
			}
		});
	};

	static escape(str){
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	static _checker;

	static check404(url, callback, timeout = 5000){
		clearTimeout(Util._checker);
		Util._checker = setTimeout(function(){
			callback(false, 'timeout');
		}, timeout + 2000);
		try{
			fetch(url, {method: 'head', timeout: timeout}).then(function(rsp){
				console.log('check result', url, rsp);
				let fail = status != 200 && status != 301 && status != 403 && status != 503 && status != 401 && status != 400;
				callback(fail, rsp);
			}).catch(function(err){
				callback(false, err);
			});
			clearTimeout(Util._checker);
		}catch(err){
			callback(false, err);
		}
	};

	static strRepeat = (str, len) => {
		let s = '';
		while(len--){
			s += str;
		}
		return s;
	};


	/**
	 * get param
	 * @param param
	 * @param url
	 * @return {string|Null}
	 */
	static getParam(param, url){
		let r = new RegExp("(\\?|#|&)" + param + "=([^&#]*)(&|#|$)");
		let m = (url || location.hash).match(r);
		return (!m ? null : m[2]);
	};

	static removeHash(){
		history.pushState("", document.title, window.location.pathname
			+ window.location.search);
	}
}

export {Util};