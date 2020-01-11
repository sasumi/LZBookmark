$.fn.commit = function(handler){
	this.each((k, el) =>{
		$(el).on('click', handler);
		$(el).on('keyup', e=>{
			if(e.which === 13){
				debugger;
				return handler.call(el, e);
			}
		})
	})
};