<?php
// OSBH iletişim formu işleyicisi (GüzelHosting cPanel PHP mail() kullanır).
// NOT: Canlıya almadan önce $to adresini ve SMTP/mail ayarlarını doğrulayın.

header('Content-Type: application/json; charset=utf-8');

$to = 'info@osbh.com.tr';

function fail(string $msg): void {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail('invalid_method');
}

// Honeypot: bot koruması
if (!empty($_POST['website'])) {
    echo json_encode(['ok' => true]);
    exit;
}

$name = trim($_POST['your-name'] ?? '');
$email = trim($_POST['your-email'] ?? '');
$subject = trim($_POST['your-subject'] ?? '');
$message = trim($_POST['your-message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    fail('missing_fields');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail('invalid_email');
}

$mailSubject = '[osbh.com.tr İletişim Formu] ' . ($subject !== '' ? $subject : 'Yeni mesaj');
$body = "İsim: $name\nE-posta: $email\nKonu: $subject\n\nMesaj:\n$message\n";

$headers = [
    'From' => 'noreply@osbh.com.tr',
    'Reply-To' => $email,
    'Content-Type' => 'text/plain; charset=UTF-8',
];
$headerStr = '';
foreach ($headers as $k => $v) {
    $headerStr .= "$k: $v\r\n";
}

$sent = mail($to, $mailSubject, $body, $headerStr);

if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    fail('mail_failed');
}
