chrome.bookmarks.getSubTree("1", function(tree_nodes){
	const COLLAPSED_LEVEL = 1;
	const EMPTY_FN = ()=>{};
	const TYPE_FOLDER = 'folder';
	const TYPE_LINK = 'link';

	let $tree = $('#bookmark-tree');
	let escape = (str)=>{
		return String(str)
			.replace(/&/g, '&amp;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
	};

	const get_parent_title_path = (item ,all_map)=>{
		let parent_title = '';
		while(item && all_map[item.parentId]){
			item = all_map[item.parentId];
			parent_title = item.title + '/' + parent_title;
		}
		return parent_title;
	};

	const array_walk_recursive = (nodes, callback)=>{
		nodes.forEach((item)=>{
			callback(item);
			if(item.children){
				array_walk_recursive(item.children, callback);
			}
		});
	};

	const plain_tree_nodes = (nodes, filter) => {
		let ret = [];
		array_walk_recursive(nodes, function(item){
			let data = {
				id: item.id,
				title: item.title,
				url: item.url,
				children_count: item.children ? item.children.length : 0
			};
			if(!filter || filter(data) !== false){
				ret.push(data)
			}
		});

		let all_map = {};
		ret.forEach((item)=>{
			all_map[item.id] = item;
		});

		for(let i=0; i<ret.length; i++){
			ret[i].parentTitles = get_parent_title_path(ret[i], all_map);
		}
		return ret;
	};

	const found_empty_folders = (tree_nodes) => {
		let nodes = plain_tree_nodes(tree_nodes);
		let ret = [];
		nodes.forEach((item)=>{
			if(item.children_count === 0 && !item.url){
				ret.push(item);
			}
		});
		return ret;
	};

	const resolve_type = (item)=>{
		return item.url ? TYPE_LINK : TYPE_FOLDER;
	};

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

	const show_confirm = (title, content, on_confirm, on_cancel)=>{
		on_cancel = on_cancel || EMPTY_FN;
		let html = `<dialog><div class="dialog-ti">${title}</div>`;
		html += `<div class="dialog-ctn">${content}</div>`;
		html += `<div class="dialog-op"><span class="btn btn-primary btn-confirm">Confirm</span> <span class="btn btn-outline btn-cancel">Cancel</span></div>`;
		html += '</dialog>';
		let $dlg = $(html).appendTo('body');
		$dlg[0].showModal();
		$dlg.find('.btn-cancel').click(function(){
			if(on_cancel() !== false){
				$dlg.remove();
			}
		});
		$dlg.find('.btn-confirm').click(function(){
			if(on_confirm() !== false){
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
			if(on_ok() !== false){
				$dlg.remove();
			}
		})
	};

	$tree.html(get_tree_html(tree_nodes, 0));
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

		debugger;
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

	$('#add-btn').click(function(){
		let html = `<div><label for="">Name</label><br/><input type="text"></div>
					<div><label for="">Link:</label><br/><input type="url"></div>`;
		show_confirm('Add Bookmark', html, function(){

		});
	});

	$('#remove-empty-folder-btn').click(function(){
		let empty_nodes = found_empty_folders(tree_nodes);
		if(empty_nodes.length){
			let html = '<div>Empty folders found:</div>';
			html += `<ul style="max-height:200px; overflow-y:scroll;">`;
			empty_nodes.forEach((item)=>{
				html += `<li><input type="checkbox" checked> ${escape(item.parentTitles)} ${item.title} </li>`;
			});
			html += `</ul>`;
			show_confirm('Remove empty folders', html, function(){

			});
		} else {
			show_alert('Remove empty folders', 'No empty bookmark folders found.');
		}
	});
});