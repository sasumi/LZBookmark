const TYPE_FOLDER = 'folder';
const TYPE_LINK = 'link';

let escape = (str)=>{
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
};

const get_parent_title_path = (item ,all_map)=>{
	let parent_title = [];
	while(item && all_map[item.parentId]){
		item = all_map[item.parentId];
		parent_title.push(item.title);
	}
	return parent_title.reverse();
};

const array_walk_recursive = (nodes, callback)=>{
	nodes.forEach((item)=>{
		callback(item);
		if(item.children){
			array_walk_recursive(item.children, callback);
		}
	});
};

const get_plain_tree_nodes = (nodes) => {
	let ret = [];
	array_walk_recursive(nodes, function(item){
		let data = {
			id: item.id,
			index: item.index,
			title: item.title,
			url: item.url,
			parentId: item.parentId,
			children_count: item.children ? item.children.length : 0
		};
		ret.push(data);
	});
	let all_map = {};
	ret.forEach((item)=>{
		all_map[item.id] = item;
	});
	for(let i=0; i<ret.length; i++){
		let titles = get_parent_title_path(ret[i], all_map);
		ret[i].parentTitle = titles.join(' / ');
		ret[i].level = titles.length;
	}
	return ret;
};

const found_empty_folders = (plain_tree_nodes) => {
	let ret = [];
	plain_tree_nodes.forEach((item)=>{
		if(item.children_count === 0 && !item.url){
			ret.push(item);
		}
	});
	return ret;
};

const found_same_url_nodes = (plain_tree_nodes)=>{
	let ret = [];
	let map = {};
	plain_tree_nodes.forEach((item)=>{
		if(!item.url){
			return;
		}
		if(map[item.url]){
			ret.push(item);
		} else {
			map[item.url] = true;
		}
	});
	return ret;
};

const check404 = (item, callback)=>{
	setTimeout(function(){
		callback(true, 'ok');
	}, 100);
};

/**
 * merge same level + same name folders
 * @param plain_tree_nodes
 * @returns {[]}
 */
const found_merge_folders = (plain_tree_nodes)=>{
	let ret = [];
	let last_level = 0;
	let tmp_titles = {};
	plain_tree_nodes.forEach((item)=>{
		if(resolve_type(item) !== TYPE_FOLDER){
			return;
		}
		if(item.level !== last_level){
			last_level = item.level;
			tmp_titles = {[item.title]: item.id};
			return;
		}

		if(tmp_titles[item.title]){
			ret.push([item, tmp_titles[item.title]]);
			return;
		}

		tmp_titles[item.title] = item.id;
	});
	return ret;
};

const str_repeat = (str, len)=>{
	let s = '';
	while(len--){
		s += str;
	}
	return s;
};

const get_children = (plain_tree_nodes, parentId)=>{
	let ret = [];
	plain_tree_nodes.forEach((item)=>{
		if(item.parentId == parentId){
			ret.push(item);
		}
	});
	return ret;
};

const get_folder_selection = (plain_nodes)=>{
	let html = '<select>';
	plain_nodes.forEach((item)=>{
		if(resolve_type(item) === TYPE_FOLDER){
			let tab = str_repeat(' ',item.level*2);
			html += `<option value="${item.id}">${tab} ${escape(item.title)}</option>`;
		}
	});
	return html + `<select>`;
};

const resolve_type = (item)=>{
	return item.url ? TYPE_LINK : TYPE_FOLDER;
};