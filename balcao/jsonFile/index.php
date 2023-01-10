<?php /*
$myFile = "general.json";
$fh = fopen($myFile, 'w') or die("can't open file");
$stringData = $_GET["data"];
fwrite($fh, $stringData);
fclose($fh)*/

var_dump($_POST);

if (isset($_POST['json'])) {
    $params = $_POST['json'];
    $jsonObject = json_encode($params);
    if (is_writable('general.json')) {
        file_put_contents('general.json', $jsonObject);
        echo "success";
    } else {
        echo "file is not writable, check permissions";
    }
} else {
    echo "invalid params";
}

?>