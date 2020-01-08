class Util {
	static EMPTY_FN = ()=>{};

	static arrayWalkRecursive = (arr, callback, childrenKey = 'children')=>{
		arr.forEach((item)=>{
			callback(item);
			if(item[childrenKey]){
				Util.arrayWalkRecursive(item[childrenKey], callback);
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

	static openLink(url, type = 'current', stay_open_flag = false){
		if(url === "current"){
			chrome.tabs.update(null, {url: url}, function(){
				if(!stay_open_flag){
					window.close();
				}
			});
		}else if(url === "new"){
			chrome.tabs.create({url: url, active: true}, function(){
				if(!stay_open_flag){
					window.close();
				}
			});
		}else if(url === "newback"){
			chrome.tabs.create({url: url, active: false}, function(){});
		}else if(url === "newwind"){
			chrome.windows.getCurrent(null, function(wd){
				chrome.windows.create({
					url: url,
					height: wd.height,
					left: wd.left,
					top: wd.top,
					width: wd.width
				}, function(){
					window.close();
				});
			});
		}else if(url === "incgwnd"){
			chrome.windows.getCurrent(null, function(wd){
				chrome.windows.create({
					url: url,
					height: wd.height,
					left: wd.left,
					top: wd.top,
					width: wd.width,
					incognito: true
				}, function(){
					window.close();
				});
			});
		}else{
			chrome.tabs.update(null, {url: url}, function(){
				if(!stay_open_flag){
					window.close();
				}
			});
		}
	}
}

export {Util};