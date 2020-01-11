<?php

/**
 * 递归的glob
 * Does not support flag GLOB_BRACE
 * @param $pattern
 * @param int $flags
 * @return array
 */
function glob_recursive($pattern, $flags = 0){
	$files = glob($pattern, $flags);
	foreach(glob(dirname($pattern).'/*', GLOB_ONLYDIR|GLOB_NOSORT) as $dir){
		$files = array_merge($files, glob_recursive($dir.'/'.basename($pattern), $flags));
	}

	//修正目录分隔符
	array_walk($files, function(&$file){
		$file = str_replace(array('/', '\\'), array(DIRECTORY_SEPARATOR, DIRECTORY_SEPARATOR), $file);
	});
	return $files;
}


/**
 * 清理数组中empty的元素
 * @param $data
 * @param bool $recursive
 * @return array
 */
function array_clear_empty($data, $recursive = true) {
	if(empty($data) || !is_array($data)) {
		return $data;
	}
	foreach ($data as $k => $item) {
		if(empty($item)) {
			unset($data[$k]);
		}
		if($recursive && is_array($item)) {
			$data[$k] = array_clear_empty($item);
			if(empty($data[$k])) {
				unset($data[$k]);
			}
		}
	}
	return $data;
}

/**
 * var_export in minimal format
 * @param $var
 * @param bool $return
 * @return mixed|string
 */
function var_export_min($var, $return = false) {
	if (is_array($var)) {
		$toImplode = array();
		foreach ($var as $key => $value) {
			$toImplode[] = var_export($key, true).'=>'.var_export_min($value, true);
		}
		$code = 'array('.implode(',', $toImplode).')';
		if ($return){
			return $code;
		}
		else echo $code;
	} else {
		return var_export($var, $return);
	}
}

/**
 * 打印trace信息
 * @param $trace
 * @param bool $with_callee
 * @param bool $with_index
 */
function print_trace($trace, $with_callee = false, $with_index = false){
	$ct = count($trace);
	foreach($trace as $k=>$item){
		$callee = '';
		if($with_callee){
			$vs = [];
			foreach($item['args'] as $arg){
				$vs[] = var_export_min($arg, true);
			}
			$arg_statement = join(',', $vs);
			$arg_statement = substr(str_replace("\n", '', $arg_statement), 0, 50);
			$callee = $item['class'] ? "\t{$item['class']}{$item['type']}{$item['function']}($arg_statement)" : "\t{$item['function']}($arg_statement)";
		}
		if($with_index){
			echo "[", ($ct - $k), "] ";
		}
		$loc = $item['file'] ? "{$item['file']} #{$item['line']} " : '';
		echo "{$loc}{$callee}", PHP_EOL;
	}
}

function dump(){
	$params = func_get_args();
	$cli = true;
	$exit = false;
	echo PHP_EOL;

	if(count($params)){
		$tmp = $params;
		$exit = array_pop($tmp) === 1;
		$params = $exit ? array_slice($params, 0, -1) : $params;
		$comma = '';
		foreach($params as $var){
			echo $comma;
			var_dump($var);
			$comma = str_repeat('-',80).PHP_EOL;
		}
	}

	//remove closure calling & print out location.
	$trace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
	if($GLOBALS['DUMP_WITH_TRACE']){
		echo "[trace]",PHP_EOL;
		print_trace($trace, true, true);
	} else {
		print_trace([$trace[0]]);
	}
	echo str_repeat('=', 80), PHP_EOL, (!$cli ? '</pre>' : '');
	$exit && exit();
}

function token_walk($content, callable $handler){
	$tokens = token_get_all($content);
	foreach($tokens as $token){
		if(is_array($token)){
			list($tk, $str, $line) = $token;
			$handler($tk, $str, $line);
		}else{
			$handler(null, $token, '');
		}
	}
}

function remove_comment($fileStr){
	$newStr = '';
	$commentTokens = [T_COMMENT, T_DOC_COMMENT];
	$tokens = token_get_all($fileStr);
	file_put_contents(__DIR__.'/tk.log', "");
	foreach($tokens as $token){
		if(is_array($token)){
			list($tk, $str, $line) = $token;
			if(in_array($tk, $commentTokens)){
				continue;
			}
			file_put_contents(__DIR__.'/tk.log', "\n Line: $line, ".token_name($tk).' '.$str, FILE_APPEND);
			$token = $str;
		}
		file_put_contents(__DIR__.'/tk.log', "\n ET:".$token, FILE_APPEND);
		$newStr .= $token;
	}
	return $newStr;
}