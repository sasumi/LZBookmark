import {Bookmark} from "./Bookmark.js";
import {Util} from "./Util.js";
import {UI} from "./UI.js";

const $body = $('body');
const h = Util.escape;
const $tree = $('#bookmark-tree');
const CLASS_FOCUS = 'item-focus';
const CLASS_ITEM = 'item-wrap';
const INIT_COLLAPSED_LEVEL = 0;
const ROOT_ID = '1';

const removeLink = (bookmark) => {
	let $li = $tree.find('[data-id=' + bookmark.id + ']');
	Bookmark.remove(bookmark.id, function(){
		$li.remove();
		UI.showToast('Bookmark removed');
	});
};

const removeFolder = (bookmark) => {
	let children_count = bookmark.children ? bookmark.children.length : 0;
	let $li = $tree.find('[data-id=' + bookmark.id + ']');
	if(!children_count){
		Bookmark.remove(bookmark.id, function(){
			$li.remove();
		});
		return;
	}
	Bookmark.getSubTree(bookmark.id, function(items){
		items.filter((item) => {
			return !Bookmark.isFolder(item);
		});
		let sub_links_html = 'Children links found:<ul class="simple-list">';
		items.forEach((item) => {
			sub_links_html += `<li>${UI.getFaviconHtml(item.url)} <a href="${h(item.url)}" target="_blank">${h(item.title)}</a></li>`;
		});
		sub_links_html += `</ul>`;
		UI.showConfirm('Confirm to remove folder?', sub_links_html, function(){
			Bookmark.removeTree(bookmark.id, function(){
				$li.remove();
				UI.showToast('Folder removed');
			});
		})
	});
};

const renderNode = (id, callback, initLevel = 0) => {
	Bookmark.getOne(id, function(item){
		let html = getTreeHtml([item], initLevel, INIT_COLLAPSED_LEVEL);
		let $exist = $tree.find('li[data-id=' + id + ']');
		if($exist.size()){
			$(html).insertBefore($exist);
			$exist.remove();
		}else{
			$(html).appendTo($tree);
		}
		callback();
	});
};

const getTreeHtml = (children, initLevel = 0, collapseLevel = 0) => {
	let html = '';
	children.forEach((item) => {
		let title = item.title || "Root";
		let type = Bookmark.getType(item);
		let isFolder = Bookmark.isFolder(item);
		let children_count = item.children ? item.children.length : 0;
		let sub_html = `<li data-id="${item.id}" data-type="${type}" data-children-count="${children_count}" class="${initLevel > collapseLevel ? 'collapsed' : ''}">`;
		sub_html += `<div class="${CLASS_ITEM}">`;
		if(isFolder){
			sub_html += `<span class="fold">${h(title)} <span class="cnt">` + children_count + `</span></span>`;
		}else{
			sub_html += `<a href="${h(item.url)}" target="_blank" title="${h(item.title + "\n" + item.url)}" class="remark">${UI.getFaviconHtml(item.url)} ${h(item.title)}</a>`;
		}

		let menu_html;
		if(isFolder){
			menu_html =
				`<span class="iconfont icon-add-folder" data-cmd="openFolder" data-id="${item.id}" data-param='{"type":"${Bookmark.OPEN_NEW_TAB_BACK}"}'>Open All Bookmarks</span>
				<span class="iconfont icon-add-folder" data-cmd="openFolder" data-id="${item.id}" data-param='{"type":"${Bookmark.OPEN_NEW_WIN}"}'>Open All Bookmarks In New Window</span>
				<span class="iconfont icon-add-folder" data-cmd="openFolder" data-id="${item.id}" data-param='{"type":"${Bookmark.OPEN_INC_WIN}"}'>Open All Bookmarks In Incognito Window</span>
				<span class="sep"></span>
				<span class="iconfont icon-add-folder" data-cmd="addFolder" data-id="${item.id}">Add Folder</span> 
				<span class="iconfont icon-edit edit-btn" data-cmd="editFolder" data-id="${item.id}">Edit</span>
				<span class="iconfont icon-trash" data-cmd="removeFolder" data-id="${item.id}">Remove</span>`;
		}else{
			menu_html =
				`<span class="iconfont icon-add-folder" data-cmd="openLink" data-value="NewTab" data-id="${item.id}" data-param='{"type":"${Bookmark.OPEN_CURRENT_TAB}"}'>Open</span>
				<span class="iconfont icon-add-folder" data-cmd="openLink" data-value="NewTab" data-id="${item.id}" data-param='{"type":"${Bookmark.OPEN_NEW_TAB}"}'>Open in New Tab</span>
				<span class="iconfont icon-add-folder" data-cmd="openLink" data-value="Background" data-id="${item.id}" data-param='{"type":"${Bookmark.OPEN_NEW_TAB_BACK}"}'>Open in Background</span>
				<span class="iconfont icon-add-folder" data-cmd="openLink" data-value="NewWindow" data-id="${item.id}" data-param='{"type":"${Bookmark.OPEN_NEW_WIN}"}'>Open in New Window</span>
				<span class="iconfont icon-add-folder" data-cmd="openLink" data-value="Incognito" data-id="${item.id}" data-param='{"type":"${Bookmark.OPEN_INC_WIN}"}'>Open in New Incognito Window</span>
				<span class="sep"></span>
				<span class="iconfont icon-edit edit-btn" data-cmd="editLink" data-id="${item.id}">Edit</span>
				<span class="iconfont icon-trash" data-cmd="removeLink" data-id="${item.id}">Remove</span>`;
		}
		sub_html += `
					<dl class="drop-list drop-list-left">
						<dt><span class="iconfont icon-option-vertical"></span></dt>
						<dd>
							${menu_html}
						</dd>
					</dl></div>`;

		if(isFolder && children_count){
			sub_html += `<ul>` + getTreeHtml(item.children, initLevel + 1, collapseLevel) + `</ul>`;
		}
		sub_html += `</li>`;
		html += sub_html;
	});
	return html;
};

const addBookmark = (parentId, callback) => {
	callback = callback || Util.EMPTY_FN;
	Bookmark.getFolderSelection(ROOT_ID, parentId, function(folder_selection_html){
		let html = `<ul class="form-item full-item">
						<li>${folder_selection_html}</li>
						<li><input type="text" required name="title" placeholder="Title" value=""></li>
						<li><input type="url" required name="url" placeholder="Url" value=""></li>
					</ul>`;
		UI.showConfirm(`Add Bookmark`, html, function($dlg){
			let parentId = $dlg.find('select').val();
			let title = $.trim($dlg.find('[name=title]').val());
			let url = $.trim($dlg.find('[name=url]').val());
			Bookmark.create({
				title: title,
				url: url,
				parentId: parentId
			}, function(){
				UI.showToast('Bookmark added');
				//@todo add bookmark
				callback();
			})
		});
	});
};

const addFolder = (bookmark) => {
	let parentId = bookmark ? bookmark.id : null;
	Bookmark.getFolderSelection(ROOT_ID, parentId, function(folder_selection_html){
		let html = `<ul class="form-item full-item">
					<li>${folder_selection_html}</li>
					<li><input type="text" required name="title" placeholder="Title" value=""></li>
				</ul>`;
		UI.showConfirm(`Add Sub Folder`, html, function($dlg){
			let title = $.trim($dlg.find('[name=title]').val());
			let url = $.trim($dlg.find('[name=url]').val());
			let parentId = $dlg.find('select').val();
			Bookmark.create({title: title, url: url, parentId: parentId}, function(){
				UI.showToast('Folder added');
			});
		});
	});
};

const sorting = (bookmark) => {
	let html = '<div>Sorting By:</div><ul class="sorting-conditions">';
	html += '<li>Type: <select><option>Folder First</option><option>Link First</option><option>As Default</option></select>';
	html += '<li>Spell: <select><option>A-Z</option><option>Z-A</option><option>As Default</option></select>';
	html += '<li>Date: <select><option>Newer First</option><option>Older First</option><option>As Default</option></select>';
	html += '</ul>';
	UI.showConfirm('Sorting bookmarks', html, function($dlg){
		UI.showToast('Bookmark sorted');
	});
};

const openFolder = (bookmark, param, callback)=>{
	Bookmark.getSubTree(bookmark.id, function(items){
		items.forEach(function(item){
			if(!Bookmark.isFolder(item)){
				Bookmark.openLink(item.url, param.type);
			}
		});
		callback();
	}, true);
};

const openLink = (bookmark, param) => {
	Bookmark.openLink(bookmark.url, param.type);
};

const editLink = (bookmark) => {
	let html = `<ul class="form-item full-item">
					<li><input type="text" required name="title" placeholder="Title" value="${h(bookmark.title)}"></li>
					<li><input type="url" required name="url" placeholder="Url" value="${h(bookmark.url)}"></li>
				</ul>`;
	UI.showConfirm(`Update Bookmark`, html, function($dlg){
		let title = $.trim($dlg.find('[name=title]').val());
		let url = $.trim($dlg.find('[name=url]').val());
		Bookmark.update(bookmark.id, {title: title, url: url}, function(){
			renderNode(bookmark.id);
			UI.showToast('Bookmark updated');
		});
	});
};

const editFolder = (bookmark) => {
	Bookmark.getFolderSelection(ROOT_ID, bookmark.parentId, function(folder_selection_html){
		let html = `<ul class="form-item full-item">
					<li>${folder_selection_html}</li>
					<li><input type="text" required name="title" placeholder="Title" value="${h(bookmark.title)}"></li>
				</ul>`;
		UI.showConfirm(`Update Bookmark`, html, function($dlg){
			let title = $.trim($dlg.find('[name=title]').val());
			let parentId = $dlg.find('select').val();
			Bookmark.update(bookmark.id, {title: title, parentId: parentId}, function(){
				renderNode(bookmark.id);
				UI.showToast('Folder updated');
			});
		});
	});
};

const cleanupFolder = (bookmark) => {
	let parentId = bookmark ? bookmark.id : ROOT_ID;
	Bookmark.getSubTree(parentId, function(plain_items){
		let empty_nodes = Bookmark.foundEmptyFolders(plain_items);
		let folders_to_merge = Bookmark.foundMergeFolders(plain_items);
		let html = '';
		if(empty_nodes.length){
			html += '<div>Empty folders found:</div>';
			html += `<ul style="max-height:100px; overflow-y:scroll;">`;
			empty_nodes.forEach((item) => {
				html += `<li><input type="checkbox" name="deletes" value="${item.id}" checked> ${h(item.parentTitle)} / <span class="iconfont icon-fold">${h(item.title)}</span> </li>`;
			});
			html += `</ul>`;
		}
		if(folders_to_merge.length){
			html += '<div>Same name folders to merge:</div>';
			html += '<ul style="max-height:200px; overflow-y:auto;">';
			folders_to_merge.forEach((tmp) => {
				let [item, to_id] = tmp;
				html += `<li><input type="checkbox" name="moves" value="${item.id}" data-to-id="${to_id}" checked> <span class="iconfont icon-fold">${h(item.title)}</span></li>`
			});
			html += '</ul>';
		}

		if(!html){
			UI.showAlert('Clean up folders', 'No empty bookmark folders found.');
			return;
		}
		UI.showConfirm('Clean up folders', html, function($dlg){
			$dlg.find('input[name=deletes]:checked').each(function(){
				Bookmark.remove(this.value);
			});
			$dlg.find('input[name=moves]:checked').each(function(){
				Bookmark.getSubTree(this.value, (children) => {
					children.forEach((item) => {
						Bookmark.move(item.id, {
							parentId: $(this).data('to-id') + ""
						});
					});
					Bookmark.remove(this.value);
				}, true);
			});
			location.reload();
		});
	}, true);
};

const cleanupItem = (bookmark) => {
	let parentId = bookmark ? bookmark.id : ROOT_ID;
	Bookmark.getSubTree(parentId, function(plain_items){
		let same_url_nodes = Bookmark.foundSameUrlNodes(plain_items);
		if(!same_url_nodes.length){
			UI.showAlert('Clean up item', 'No duplicate bookmark items found.');
			return;
		}

		let html = '';
		html += '<div>Duplicate bookmark found:</div>';
		html += `<ul style="max-height:200px; overflow-y:auto;">`;
		same_url_nodes.forEach((item) => {
			html += `<li><label><input type="checkbox" name="deletes" value="${item.id}" checked> ${h(item.title)}</label></li>`;
		});
		html += '</ul>';
		UI.showConfirm('Clean up item', html, function($dlg){
			$dlg.find('input[name=deletes]:checked').each(function(){
				Bookmark.remove(this.value);
			});
			location.reload();
		});
	}, true);
};

const remove404 = (id = ROOT_ID) => {
	Bookmark.getSubTree(id, function(plain_items){
		let links = [];
		plain_items.forEach(function(item){
			if(item.url){
				links.push(item);
			}
		});
		let total = links.length;
		let html =
			`<div class="bookmark-checking-timeout">Timeout: <input type="number" name="timeout" value="8" min="1" step="1"> Sec</div>
				<div class="bookmark-checking run-info">
					Progress: <span class="cnt">0</span> / ${total} <span class="percent">0%</span>
					<progress max="${total}" value="0"></progress>
					<span class="current-site" style="display:none;">Checking: <a href="" target="_blank"></a></span>
				</div>`;

		html += `<ul class="bookmark-checking-result-list" style="display:none;">`;
		html += '</ul>';
		let op_html = `<span class="btn btn-primary btn-start iconfont icon-start">Start Check</span>`;
		op_html += `<span class="btn btn-outline btn-stop iconfont icon-stop" style="display:none;">Stop</span>`;
		op_html += `<span class="btn btn-outline btn-deletes iconfont icon-trash" style="display:none;">Remove Selection</span>`;
		op_html += '<span class="btn btn-outline btn-close">Close</span>';

		UI.showDialog('Remove 404 bookmarks', html, op_html, function($dlg){
			let $progress = $dlg.find('progress');
			let $cnt = $dlg.find('.cnt');
			let $percent = $dlg.find('.percent');
			let $current = $dlg.find('.current-site');
			let $error_list = $dlg.find('ul');
			let $timeout_input = $dlg.find('input[name=timeout]');

			let stop_sign = false;

			let $start_btn = $dlg.find('.btn-start');
			let $stop_btn = $dlg.find('.btn-stop');
			let $delete_btn = $dlg.find('.btn-deletes');
			let $close_btn = $dlg.find('.btn-close');

			$close_btn.click(function(){
				stop_sign = true;
				$dlg.remove();
			});

			$dlg.delegate('.btn-remove', 'click', function(){
				let id = $(this).closest('li').find('input[name=fails]').val();
				Bookmark.remove(id);
				$(this).closest('li').remove();
			});

			$delete_btn.click(function(){
				let $inputs = $error_list.find('input[name=fails]');
				let count = $inputs.size();
				if(!count){
					alert('No item selected');
					return;
				}
				if(confirm('Confirm to remove ' + count + ' bookmarks?')){
					$inputs.each(function(){
						Bookmark.remove(this.value);
					});
					location.reload();
				}
			});

			$stop_btn.click(function(){
				stop_sign = true;
				$start_btn.show();
				$stop_btn.hide();
				$delete_btn.show();
				$current.hide();
				$timeout_input.removeAttr('disabled');
			});

			$start_btn.click(function(){
				$start_btn.hide();
				$stop_btn.show();
				$delete_btn.hide();
				$current.show();
				$timeout_input.attr('disabled', 'disabled');
				let timeout = parseInt($timeout_input.val(), 10) * 1000;
				let tmp = links;
				let current_cnt = 0;
				let do_check = function(item, on_item_finish){
					if(!item || stop_sign){
						return;
					}
					$current.find('a').attr('href', item.url).text(item.title);
					Util.check404(item.url, function(is_success, message){
						on_item_finish(item, is_success, message);
						do_check(tmp.shift(), on_item_finish);
					}, timeout)
				};
				do_check(tmp.shift(), function(item, is_success, message){
					current_cnt++;
					$cnt.html(current_cnt);
					$percent.html((Math.round(100 * current_cnt / total)) + '%');
					$progress.val(current_cnt);
					if(!is_success){
						$error_list.show();
						let html = `<li> 
											<input type="checkbox" name="fails" value="${item.id}" checked> 
											<a href="${h(item.url)}" target="_blank">${h(item.title)}</a> 
											<span class="err">${h(message)}</span>
											<span class="btn-remove link iconfont icon-trash"></span>
										</li>`;
						$(html).prependTo($error_list);
					}
				});
			});
		});
	}, true);
};

const renderTree = (id, callback, initLevel = 0) => {
	Bookmark.getSubTree(id, function(items){
		let html = getTreeHtml(items, initLevel, INIT_COLLAPSED_LEVEL);
		let $exist = $tree.find('li[data-id=' + id + ']');
		if($exist.size()){
			$(html).insertBefore($exist);
			$exist.remove();
		}else{
			$(html).appendTo($tree);
		}
		callback();
	});
};

//context even binding
const show_menu = ($li, [x, y]) => {
	if(!show_menu.$context){
		show_menu.$context = $(`<div class="context-menu context-menu-with-point"></div>`).appendTo('body');
	}
	show_menu.$context.html($li.find('.drop-list dd').html()).css({left: x, top: y}).show();
	$tree.find('.' + CLASS_ITEM).removeClass(CLASS_FOCUS);
	$li.find('.' + CLASS_ITEM).eq(0).addClass(CLASS_FOCUS);
};

const hide_menu = ()=>{
	$tree.find('.' + CLASS_ITEM).removeClass(CLASS_FOCUS);
	if(show_menu.$context){
		show_menu.$context.hide();
	}
};

$body.click(function(e){
	if(show_menu.$context && ($.contains(show_menu.$context[0], e.target) || show_menu.$context[0] === e.target)){
		//click on context menu
	}else{
		hide_menu();
	}
});

$tree.contextmenu(function(e){
	let $tag = $(e.target);
	let $li = null;
	if($tag.hasClass(CLASS_ITEM) || $tag.closest('.' + CLASS_ITEM).size()){
		$li = $tag.closest('li');
		show_menu($li, [e.clientX, e.clientY]);
		return false;
	}
});

$tree.delegate('.fold', 'click', function(){
	let $item = $(this).closest('li');
	$item.toggleClass('collapsed');
	$item.find('li').addClass('collapsed');
});

const Actions = {
	addBookmark: addBookmark,
	sorting: sorting,
	remove404: remove404,
	cleanupFolder: cleanupFolder,
	cleanupItem: cleanupItem,
	addFolder: addFolder,
	openLink: openLink,
	openFolder:openFolder,
	editLink: editLink,
	editFolder: editFolder,
	removeFolder: removeFolder,
	removeLink: removeLink
};

//operate even binding
$body.delegate('[data-cmd]', 'click', function(){
	let $menu_item = $(this);
	let cmd = $menu_item.data('cmd');
	let id = $menu_item.data('id');
	let param = $menu_item.data('param');

	let callAction = (act, item, param) => {
		if(!Actions[act]){
			throw "No action found";
		}
		Actions[act](item, param);
		hide_menu();
	};
	if(id){
		Bookmark.getOne(id, function(item){
			callAction(cmd, item, param);
		})
	}else{
		callAction(cmd, null, param);
	}
});

renderTree(ROOT_ID, function(){
	const check_action = () => {
		let action = Util.getParam('act');
		if(!action){
			return;
		}
		if(!Actions[action]){
			throw "No action founds";
		}
		Actions[action]();
		Util.removeHash();
	};
	window.onhashchange = check_action;
	check_action();
}, 0);