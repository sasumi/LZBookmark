import {Bookmark} from "./Bookmark.js";
import {Util} from "./Util.js";

chrome.bookmarks.getSubTree("1", function(tree_nodes){
	const COLLAPSED_LEVEL = 1;
	const EMPTY_FN = ()=>{};
	let h = Util.escape;
	let $tree = $('#bookmark-tree');

	const get_tree_html = (children, level)=>{
		let html = '';
		children.forEach((item)=>{
			let title = item.title || "Root";
			let type = Bookmark.resolveType(item);
			let children_count = item.children ? item.children.length : 0;
			let sub_html = `<li data-id="${item.id}" data-type="${type}" data-children-count="${children_count}" class="${level === COLLAPSED_LEVEL ? 'collapsed':''}">`;
			sub_html += '<div class="item-wrap">';
			if(type === Bookmark.TYPE_FOLDER){
				sub_html += `<span class="fold">${h(title)} <span class="cnt">`+item.children.length+`</span></span>`;
			} else {
				sub_html += `<a href="${h(item.url)}" target="_blank" title="${h(item.title+"\n"+item.url)}" class="remark">${Bookmark.getFaviconHtml(item)} ${h(item.title)}</a>`;
			}
			sub_html += `
					<dl class="drop-list drop-list-left">
						<dt><span class="iconfont icon-option-vertical"></span></dt>
						<dd>
							<span class="link edit-btn">Edit</span>
							<span class="link remove-btn">Remove</span>
						</dd>
					</dl></div>`;

			if(type === Bookmark.TYPE_FOLDER && children_count){
				sub_html += `<ul>`+get_tree_html(item.children, level+1)+`</ul>`;
			}
			sub_html += `</li>`;
			html += sub_html;
		});
		return html;
	};

	const show_dialog = (title, content, op_html, on_show) =>{
		let html = `<dialog><div class="dialog-ti">${title}</div>`;
		html += `<div class="dialog-ctn">${content}</div>`;
		html += `<div class="dialog-op">${op_html}</div>`;
		html += '</dialog>';
		let $dlg = $(html).appendTo('body');
		$dlg[0].showModal();
		on_show($dlg);
	};

	const show_confirm = (title, content, on_confirm, on_cancel)=>{
		on_cancel = on_cancel || EMPTY_FN;
		let html = `<dialog><div class="dialog-ti">${title}</div>`;
		html += `<div class="dialog-ctn">${content}</div>`;
		html += `<div class="dialog-op"><span class="btn btn-primary btn-confirm">Confirm</span> <span class="btn btn-outline btn-cancel">Cancel</span></div>`;
		html += '</dialog>';
		let $dlg = $(html).appendTo('body');
		$dlg[0].showModal();
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
	};

	const show_alert = (title, content, on_ok)=>{
		on_ok = on_ok || EMPTY_FN;
		let html = `<dialog><div class="dialog-ti">${title}</div>`;
		html += `<div class="dialog-ctn">${content}</div>`;
		html += `<div class="dialog-op"><span class="btn btn-outline btn-ok">Close</span></div>`;
		html += '</dialog>';
		let $dlg = $(html).appendTo('body');
		$dlg[0].showModal();
		$dlg.find('.btn-ok').click(function(){
			if(on_ok($dlg) !== false){
				$dlg.remove();
			}
		})
	};

	$tree.html(get_tree_html(tree_nodes, 0));
	let plain_tree_nodes = Bookmark.getPlainTreeNodes(tree_nodes);

	$tree.delegate('.fold', 'click', function(){
		let $item = $(this).closest('li');
		$item.toggleClass('collapsed');
		$item.find('li').addClass('collapsed');
	});

	$tree.delegate('.edit-btn', 'click', function(){
		let id = $(this).closest('li').data('id');
		let item = plain_tree_nodes[id];
		update_bookmark_ui(item);
	});

	$tree.delegate('.remove-btn', 'click', function(){
		let $li = $(this).closest('li');
		let type = $li.data('type');
		let id = $li.data('id')+"";
		let children_count = $li.data('children-count');
		if(type === Bookmark.TYPE_LINK || !children_count){
			chrome.bookmarks.remove(id, function(){
				$li.remove();
			});
		}

		let sub_links = Bookmark.getChildren(plain_tree_nodes, id, true, (item)=>{return !Bookmark.isFolder(item);});
		let sub_links_html = 'Children links found:<ul class="simple-list">';
		sub_links.forEach((item)=>{
			sub_links_html += `<li>${Bookmark.getFaviconHtml(item)} <a href="${h(item.url)}" target="_blank">${h(item.title)}</a></li>`;
		});
		sub_links_html += `</ul>`;

		show_confirm('Confirm to remove folder?',sub_links_html, function(){
			chrome.bookmark.removeTree(id, function(){
				$li.remove();
			});
		})
	});

	const update_bookmark_ui = (bookmark = {title:"", url:"", id:null}, on_success)=>{
		on_success = on_success || EMPTY_FN;
		let pre_text = bookmark.id ? 'Update' : 'Add';
		let folder_selection_html = bookmark.id ? '' : '<li>'+Bookmark.getFolderSelection(plain_tree_nodes, bookmark.id)+'</li>';
		let html = `<ul class="form-item full-item">
						${folder_selection_html}
						<li><input type="text" required name="title" placeholder="Title" value="${h(bookmark.title)}"></li>
						<li><input type="url" required name="url" placeholder="Url" value="${h(bookmark.url)}"></li>
					</ul>`;
		show_confirm(`${pre_text} Bookmark`, html, function($dlg){
			let title = $.trim($dlg.find('[name=title]').val());
			let url = $.trim($dlg.find('[name=url]').val());
			if(bookmark.id){
				chrome.bookmarks.update(bookmark.id, {title:title, url:url}, function(){
					let $node = $tree.find('li[data-id='+bookmark.id+']');
					if(Bookmark.isFolder(bookmark)){
						let org_cnt = $node.find('.cnt').text();
						$node.find('.fold').html(h(title) + (org_cnt ? `<span class="cnt">${org_cnt}</span>` : ''));
					} else {
						$node.find('.remark')
							.attr('title', title+"\n"+url)
							.attr('href', url).text(title);
					}
					on_success();
				});
			} else {
				location.reload();
			}
		});
	};

	const do_action = ()=>{
		let action = Util.getParam('act');
		switch(action){
			case 'sorting':
				{
					let html = '<div>Sorting By:</div><ul class="sorting-conditions">';
					html += '<li>Type: <select><option>Folder First</option><option>Link First</option><option>As Default</option></select>';
					html += '<li>Spell: <select><option>A-Z</option><option>Z-A</option><option>As Default</option></select>';
					html += '<li>Date: <select><option>Newer First</option><option>Older First</option><option>As Default</option></select>';
					html += '</ul>';
					show_confirm('Sorting bookmarks', html, function($dlg){

					});
				}
				break;

			case 'add':
				update_bookmark_ui();
				break;

			case 'remove404':
				{
					let links = [];
					plain_tree_nodes.forEach(function(item){
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

					show_dialog('Remove 404 bookmarks', html, op_html, function($dlg){
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
							chrome.bookmarks.remove(id);
							$(this).closest('li').remove();
						});

						$delete_btn.click(function(){
							let $inputs = $error_list.find('input[name=fails]');
							let count = $inputs.size();
							if(!count){
								alert('No item selected');
								return;
							}
							if(confirm('Confirm to remove '+count+' bookmarks?')){
								$inputs.each(function(){
									chrome.bookmark.remove(this.value);
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
								},timeout)
							};
							do_check(tmp.shift(), function(item, is_success, message){
								current_cnt++;
								$cnt.html(current_cnt);
								$percent.html((Math.round(100*current_cnt/total)) + '%');
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
				}
				break;

			case 'cleanup_folder':
				{
					let empty_nodes = Bookmark.foundEmptyFolders(plain_tree_nodes);
					let folders_to_merge = Bookmark.foundMergeFolders(plain_tree_nodes);
					let html = '';
					if(empty_nodes.length){
						html += '<div>Empty folders found:</div>';
						html += `<ul style="max-height:100px; overflow-y:scroll;">`;
						empty_nodes.forEach((item)=>{
							html += `<li><input type="checkbox" name="deletes" value="${item.id}" checked> ${h(item.parentTitle)} / <span class="iconfont icon-fold">${h(item.title)}</span> </li>`;
						});
						html += `</ul>`;
					}
					if(folders_to_merge.length){
						html += '<div>Same name folders to merge:</div>';
						html += '<ul style="max-height:200px; overflow-y:auto;">';
						folders_to_merge.forEach((tmp)=>{
							let [item, to_id] = tmp;
							html += `<li><input type="checkbox" name="moves" value="${item.id}" data-to-id="${to_id}" checked> <span class="iconfont icon-fold">${h(item.title)}</span></li>`
						});
						html += '</ul>';
					}

					if(!html){
						show_alert('Clean up folders', 'No empty bookmark folders found.');
						return;
					}
					show_confirm('Clean up folders', html, function($dlg){
						$dlg.find('input[name=deletes]:checked').each(function(){
							chrome.bookmarks.remove(this.value);
						});
						$dlg.find('input[name=moves]:checked').each(function(){
							let children = Bookmark.getChildren(plain_tree_nodes, this.value);
							children.forEach((item)=>{
								chrome.bookmarks.move(item.id, {
									parentId: $(this).data('to-id')+""
								});
							});
							chrome.bookmarks.remove(this.value);
						});
						location.reload();
					});
				}
				break;

			case 'cleanup_item':
				{
					let same_url_nodes = Bookmark.foundSameUrlNodes(plain_tree_nodes);
					let html = '';

					if(!same_url_nodes.length){
						show_alert('Clean up item', 'No duplicate bookmark items found.');
						return;
					}

					html += '<div>Duplicate bookmark found:</div>';
					html += `<ul style="max-height:200px; overflow-y:auto;">`;
					same_url_nodes.forEach((item)=>{
						html += `<li><label><input type="checkbox" name="deletes" value="${item.id}" checked> ${h(item.title)}</label></li>`;
					});
					html += '</ul>';
					show_confirm('Clean up item', html, function($dlg){
						$dlg.find('input[name=deletes]:checked').each(function(){
							chrome.bookmarks.remove(this.value);
						});
						location.reload();
					});
				}
				break;

			case 'merge_similar':
				break;

		}
		if(action){
			Util.removeHash();
		}
	};

	window.onhashchange = do_action;
	do_action();

});