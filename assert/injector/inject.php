<?php
require_once __DIR__.'/func/func.php';

$opt = getopt('d:o:');
$GLOBALS['root'] = $opt['d'];
$GLOBALS['output'] = $opt['o'] ? $opt['o']: $opt['d'];//__DIR__.'/tmp/';
$GLOBALS['project'] = resolve_project($opt['d']);

define('RUNNER', __DIR__.'/runner/run.inc.php');
define('DEBUG', false);

///// start ////
pl('START PROJECT:'.$GLOBALS['root']);
dir_inject($GLOBALS['root']);

function file_name_cleanup(&$f){
	$win = stripos(PHP_OS, 'win') !== false;
	if($win){
		$f = str_replace('\\', '/', $f);
	}
}

function resolve_project($project_root){
	file_name_cleanup($project_root);
	$n = explode('/', $project_root);
	array_clear_empty($n);
	return array_pop($n)."_".substr(md5($project_root), 16);
}

function resolve_new_file($project_root, $file, $output_dir){
	file_name_cleanup($project_root);
	file_name_cleanup($file);
	file_name_cleanup($output_dir);
	$fn = str_replace($project_root, '', $file);
	$fn = ltrim($fn, '/');

	return $output_dir.'/'.$fn;
//	$project_name = resolve_project($project_root);
//	return $output_dir.'/'.$project_name.'/'.$fn;
}

function file_store($content, $file){
	if(DEBUG){
		return true;
	}
	$new_dir = dirname($file);
	if(!is_dir($new_dir)){
		mkdir($new_dir, 0777, true);
	}
	return file_put_contents($file, $content);
}

function pl(){
	echo "\n",join('  ', func_get_args());
}

function ps($sep = '-'){
	echo "\n\n", str_repeat($sep, 80);
}

function dir_inject($dir){
	file_name_cleanup($dir);
	$files = glob_recursive($dir.'/*');
//	$files = ['d:\htdocs\sales\erp\app\controller\ArticleController.php'];
	foreach($files as $file){
		file_injection($file);
	}
}

function file_injection($file){
	ps();
	pl("Processing file: $file");

	if(is_dir($file)){
		pl('Director detected, ignored', $file);
		return;
	}

	if(!preg_match('/\.php$/i', $file)){
		pl("Not php file, copy only.", $file);
		return;
	}
	$content = file_get_contents($file);
	$func_st = "__pm_s__(__FUNCTION__,__FILE__,__LINE__);";
	$func_ed = "__pm_e__(__FUNCTION__,__FILE__,__LINE__);";
	$runner = '<?php include_one(\''.RUNNER.'\');?>';

	file_put_contents(__DIR__.'/tk.log', '');

	$new_content = '';
	$use_flag = false;
	$func_flag = false;

	$token_debugs = '';
	$matched = false;

	token_walk($content, function($tk, $str, $line)use(&$new_content, &$use_flag, &$func_flag, &$func_st, &$token_debugs, &$matched){
		$new_content .= $str;
		$token_debugs .= "\nLine: $line, ".token_name($tk)." Snippet:".$str;
		if($tk == T_WHITESPACE){
			return;
		}

		//ignore "use function"
		if(!$use_flag && $tk == T_FUNCTION){
			$func_flag = true;
			return;
		}

		//"use" flag
		if($tk == T_USE){
			$use_flag = true;
			$func_flag = false;
		} else {
			$use_flag = false;
		}

		if($func_flag && $tk == T_STRING){
			pl('Func Detected:', $str);
		}

		//brace after function
		if($func_flag && $str == '{'){
			$matched = true;
			$new_content .= $func_st;
			$func_flag = false;
		}
	});

	file_put_contents('tk.log', $token_debugs);

	if(!$matched){
		pl('No Function found, content size:'.strlen($content));
		$new_content = $content;
	}

	$new_file = resolve_new_file($GLOBALS['root'], $file, $GLOBALS['output']);
	file_store($new_content, $new_file);
	pl('File saved:', $new_file);
}