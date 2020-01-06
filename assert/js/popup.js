chrome.bookmarks.getSubTree("1", function(tree_nodes){
	const COLLAPSED_LEVEL = 1;
	const EMPTY_FN = ()=>{};
	const TYPE_FOLDER = 'folder';
	const TYPE_LINK = 'link';

	let $tree = $('#bookmark-tree');

	const get_tree_html = (children, level)=>{
		let html = '';
		children.forEach((item)=>{
			let title = item.title || "Root";
			let type = resolve_type(item);
			let children_count = item.children ? item.children.length : 0;
			let sub_html = `<li data-id="${item.id}" data-type="${type}" data-children-count="${children_count}" class="${level === COLLAPSED_LEVEL ? 'collapsed':''}">`;
			if(type === TYPE_FOLDER){
				sub_html += `<span class="fold">${escape(title)} <span class="cnt">`+item.children.length+`</span></span>`;
			} else {
				sub_html += `<a href="${escape(item.url)}" title="${escape(item.title+"\n"+item.url)}" class="remark">${escape(item.title)}</a>`;
			}
			sub_html += `<span class="op">
							<span class="link edit-btn">Edit</span>
							<span class="link remove-btn">Remove</span>
						</span>`;

			if(type === TYPE_FOLDER && children_count){
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
		html += `<div class="dialog-op"><span class="btn btn-outline btn-ok">OK</span></div>`;
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

	let plain_tree_nodes = get_plain_tree_nodes(tree_nodes);

	$tree.delegate('.fold', 'click', function(){
		let $item = $(this).closest('li');
		$item.toggleClass('collapsed');
		$item.find('li').addClass('collapsed');
	});

	$tree.delegate('.remove-btn', 'click', function(){
		let $li = $(this).closest('li');
		let type = $li.data('type');
		let id = $li.data('id');
		let children_count = $li.data('children-count');
		if(type === TYPE_FOLDER && !children_count){
			console.log('remove empty fold');
			chrome.bookmarks.remove(id+"", function(){
				let only = $li.parent().children().length === 1;
				if(only){
					$li.parent().remove();
				}else{
					$li.remove();
				}
			});
		}
	});

	const update_bookmark_ui = (bookmark = {title:"", url:""}, on_success)=>{
		on_success = on_success || EMPTY_FN;
		let pre_text = bookmark.id ? 'Update' : 'Add';
		let folder_selection_html = bookmark.id ? '' : '<li>'+get_folder_selection(plain_tree_nodes, bookmark.id)+'</li>';
		let html = `<ul class="form-item full-item">
						${folder_selection_html}
						<li><input type="text" required name="title" placeholder="Title" value="${escape(bookmark.title)}"></li>
						<li><input type="url" required name="url" placeholder="Url" value="${escape(bookmark.url)}"></li>
					</ul>`;
		show_confirm(`${pre_text} Bookmark`, html, function($dlg){
			let title = $.trim($dlg.find('[name=title]').val());
			let url = $.trim($dlg.find('[name=url]').val());
			if(bookmark.id){
				chrome.bookmarks.update(bookmark.id, {title:title, url:url}, function(){
					let $node = $tree.find('li[data-id='+bookmark.id+']');
					if(resolve_type(bookmark) === TYPE_FOLDER){
						let org_cnt = $node.find('.cnt').text();
						$node.find('.fold').html(escape(title) + (org_cnt ? `<span class="cnt">${org_cnt}</span>` : ''));
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

	$('#add-btn').click(function(){
		update_bookmark_ui();
	});

	$('#remove404-btn').click(function(){
		let links = [];
		plain_tree_nodes.forEach(function(item){
			if(item.url){
				links.push(item);
			}
		});
		let total = links.length;
		let html =
			`<div class="bookmark-checking run-info">
				Checking: <span class="cnt">0</span> / ${total} <span class="percent">0%</span>
				<progress max="${total}" value="0"></progress>
				<span class="current-site"><a href="" target="_blank"></a></span>
			</div>`;

		html += `<ul style="max-height:200px; overflow-y:auto;">`;
		html += '</ul>';
		let op_html = `<span class="btn btn-primary btn-start">Start Check</span>`;
		show_dialog('Remove 404 bookmarks', html, op_html, function($dlg){
			let $progress = $dlg.find('progress');
			let $cnt = $dlg.find('.cnt');
			let $percent = $dlg.find('.percent');
			let $current = $dlg.find('.current-site a');
			$dlg.find('.btn-start').click(function(){
				$(this).addClass('btn-disabled');
				let tmp = links;
				let current_cnt = 0;
				let do_check = function(item, on_item_finish){
					if(!item){
						return;
					}
					check404(item, function(is_success, message){
						current_cnt++;
						$cnt.html(current_cnt);
						$percent.html((Math.round(100*current_cnt/total)) + '%');
						on_item_finish();
						$current.attr('href', item.url).text(item.title);
						do_check(tmp.shift(), on_item_finish);
					})
				};
				do_check(tmp.shift(), function(){
					$progress.val(current_cnt);
				});
			});
		})
	});

	$('#cleanup-item-btn').click(function(){
		let same_url_nodes = found_same_url_nodes(plain_tree_nodes);
		let html = '';

		if(!same_url_nodes.length){
			show_alert('Clean up item', 'No duplicate bookmark items found.');
			return;
		}

		html += '<div>Duplicate bookmark found:</div>';
		html += `<ul style="max-height:200px; overflow-y:auto;">`;
		same_url_nodes.forEach((item)=>{
			html += `<li><label><input type="checkbox" name="deletes" value="${item.id}" checked> ${escape(item.title)}</label></li>`;
		});
		html += '</ul>';
		show_confirm('Clean up item', html, function($dlg){
			$dlg.find('input[name=deletes]:checked').each(function(){
				chrome.bookmarks.remove(this.value);
			});
			location.reload();
		});
	});

	$('#cleanup-folder-btn').click(function(){
		let empty_nodes = found_empty_folders(plain_tree_nodes);
		let folders_to_merge = found_merge_folders(plain_tree_nodes);
		let html = '';
		if(empty_nodes.length){
			html += '<div>Empty folders found:</div>';
			html += `<ul style="max-height:100px; overflow-y:scroll;">`;
			empty_nodes.forEach((item)=>{
				html += `<li><input type="checkbox" name="deletes" value="${item.id}" checked> ${escape(item.parentTitle)} / <span class="iconfont icon-fold">${escape(item.title)}</span> </li>`;
			});
			html += `</ul>`;
		}
		if(folders_to_merge.length){
			html += '<div>Same name folders to merge:</div>';
			html += '<ul style="max-height:200px; overflow-y:auto;">';
			folders_to_merge.forEach((tmp)=>{
				[item, to_id] = tmp;
				html += `<li><input type="checkbox" name="moves" value="${item.id}" data-to-id="${to_id}" checked> <span class="iconfont icon-fold">${escape(item.title)}</span></li>`
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
				let children = get_children(plain_tree_nodes, this.value);
				children.forEach((item)=>{
					chrome.bookmarks.move(item.id, {
						parentId: $(this).data('to-id')+""
					});
				});
				chrome.bookmarks.remove(this.value);
			});
			location.reload();
		});
	});
});