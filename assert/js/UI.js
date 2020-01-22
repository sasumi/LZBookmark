import {I18N} from "./I18N.js";
import {Util} from "./Util.js";

const _ = I18N._;

class UI {
	static showConfirm(title, content){
		return new Promise((resolve, reject)=>{
			let op_html = `<span class="btn btn-primary btn-confirm" tabindex="0">${_('Confirm')}</span> <span class="btn btn-outline btn-cancel" tabindex="0">${_('Cancel')}</span>`;
			UI.showDialog(title, content, op_html, function($dlg){
				$dlg.find('.btn-cancel').commit(e=>{
					if(reject() !== false){
						$dlg.remove();
					}
				});
				$dlg.find('.btn-confirm').commit(e=>{
					if(resolve($dlg) !== false){
						$dlg.remove();
					}
				});
			});
		});
	};

	static showForm(title, content, buttonLabels = {save: _('Save'), cancel: _('Cancel')}){
		return new Promise((resolve, reject) => {

		})
	}

	static showAlert(title, content, on_ok){
		let op_html = `<span class="btn btn-outline btn-ok" tabindex="0">${_('Close')}</span>`;
		UI.showDialog(title, content, op_html, function($dlg){
			$dlg.find('.btn-ok').commit(e=>{
				on_ok = on_ok || Util.EMPTY_FN;
				if(on_ok($dlg) !== false){
					$dlg.remove();
				}
			});
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

	static showToast(message, type = 'success', onFinish, timeout = 1000){
		let $toast = $('.toast');
		if(!$toast.size()){
			$toast = $(`<div class="toast" style="none"><span class="toast-content"></span><span class="toast-close-btn" tabindex="0">${_('Close')}</span></div>`).appendTo('body');
			$toast.find('.toast-close-btn').click(()=>{
				clearTimeout($toast.timeout);
				$toast.stop().hide();
			});
		}
		$toast[0].className = 'toast ' + type;
		clearTimeout($toast.timeout);
		$toast.find('.toast-content').html(message);
		$toast.stop().css('opacity', 0).show().animate({opacity: 1}, 'fast', function(){
			$toast.timeout = setTimeout(() => {
				$toast.animate({opacity: 0}, () => {
					$toast.hide();
				});
			}, timeout);
		});
		//force call onFinish anywhere
		setTimeout(onFinish, timeout + 500);
	}

	static getFaviconHtml(url){
		return '<span class="favicon" style=\'background-image:url("chrome://favicon/size/16@1x/'+url+'\');"></span>';
	}
}

export {UI};