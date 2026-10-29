<?php
header("Access-Control-Allow-Origin: *");
header("Content-type: application/json");
// TODO: databasegegevens verwijderd (secrets). Werkt niet meer: vul host/gebruiker/wachtwoord in om deze legacy code opnieuw te laten draaien.
$host="";
$username="";
$password="";
$db_name="boekmap";

$conn = new mysqli($host, $username, $password, $db_name, "3306");

if ($conn->connect_errno) {
    die("connection failed:" . $conn->connect_errno);
}

$sql = "SELECT * FROM books";
$result = $conn->query($sql);
$arrRes = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $arrRes[] = $row;
    }
} else {
    echo "0 results";
}
$conn->close();

print(json_encode($arrRes, JSON_NUMERIC_CHECK));

?>