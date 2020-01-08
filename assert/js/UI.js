import {Util} from "./Util.js";

class UI {
	static showConfirm(title, content, on_confirm, on_cancel){
		let op_html = `<span class="btn btn-primary btn-confirm">Confirm</span> <span class="btn btn-outline btn-cancel">Cancel</span>`;
		UI.showDialog(title, content, op_html, function($dlg){
			on_cancel = on_cancel || Util.EMPTY_FN;
			$dlg.find('.btn-cancel').click(function(){
				if(on_cancel($dlg) !== false){
					$dlg.remove();
				}
			});
			$dlg.find('.btn-confirm').click(function(){
				if(on_confirm($dlg) !== false){
					$dlg.remove();
				}
			});
		});
	};

	static showAlert(title, content, on_ok){
		let op_html = `<span class="btn btn-outline btn-ok">Close</span>`;
		UI.showDialog(title, content, op_html, function($dlg){
			on_ok = on_ok || Util.EMPTY_FN;
			if(on_ok($dlg) !== false){
				$dlg.remove();
			}
		});
	};

	static showDialog(title, content, op_html, on_show){
		let html = `<dialog><div class="dialog-ti">${title}</div>`;
		html += `<div class="dialog-ctn">${content}</div>`;
		html += op_html ? `<div class="dialog-op">${op_html}</div>` : '';
		html += '</dialog>';
		let $dlg = $(html).appendTo('body');
		$dlg[0].showModal();
		on_show($dlg);
	};

	static getFaviconHtml(url){
		return '<span class="favicon" style=\'background-image:url("chrome://favicon/size/16@1x/'+url+'\');"></span>';
	}
}

export {UI};