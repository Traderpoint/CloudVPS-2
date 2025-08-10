<?php
/**
 * HostBill GoPay Payment Gateway Module
 * Simple version for HostBill integration
 */

function gopay_config() {
    return array(
        'name' => 'GoPay Payment Gateway',
        'description' => 'Accept payments via GoPay - cards, bank transfers, and alternative payment methods',
        'version' => '1.0.0',
        'author' => 'HostBill GoPay Module',
        'fields' => array(
            'goid' => array(
                'name' => 'GoID',
                'description' => 'Your GoPay GoID (Merchant ID)',
                'type' => 'text',
                'required' => true
            ),
            'client_id' => array(
                'name' => 'Client ID',
                'description' => 'Your GoPay Client ID',
                'type' => 'text',
                'required' => true
            ),
            'client_secret' => array(
                'name' => 'Client Secret',
                'description' => 'Your GoPay Client Secret',
                'type' => 'password',
                'required' => true
            ),
            'test_mode' => array(
                'name' => 'Test Mode',
                'description' => 'Enable test mode for development',
                'type' => 'yesno',
                'default' => 'yes'
            ),
            'language' => array(
                'name' => 'Default Language',
                'description' => 'Default language for payment gateway',
                'type' => 'dropdown',
                'options' => array(
                    'CS' => 'Czech',
                    'SK' => 'Slovak',
                    'EN' => 'English',
                    'DE' => 'German',
                    'PL' => 'Polish'
                ),
                'default' => 'CS'
            )
        )
    );
}

function gopay_link($params) {
    $isTest = ($params['test_mode'] === 'yes');
    $apiUrl = $isTest ? 'https://gw.sandbox.gopay.com/api' : 'https://gate.gopay.cz/api';
    
    // Get access token
    $tokenUrl = $apiUrl . '/oauth2/token';
    $tokenData = array(
        'grant_type' => 'client_credentials',
        'scope' => 'payment-create'
    );
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Accept: application/json',
        'Content-Type: application/x-www-form-urlencoded',
        'Authorization: Basic ' . base64_encode($params['client_id'] . ':' . $params['client_secret'])
    ));
    
    $tokenResponse = curl_exec($ch);
    $tokenResult = json_decode($tokenResponse, true);
    curl_close($ch);
    
    if (!isset($tokenResult['access_token'])) {
        return '<div class="alert alert-danger">GoPay authentication failed</div>';
    }
    
    // Create payment
    $paymentUrl = $apiUrl . '/payments/payment';
    $paymentData = array(
        'payer' => array(
            'default_payment_instrument' => 'BANK_ACCOUNT',
            'allowed_payment_instruments' => array('BANK_ACCOUNT', 'PAYMENT_CARD'),
            'contact' => array(
                'first_name' => $params['clientdetails']['firstname'],
                'last_name' => $params['clientdetails']['lastname'],
                'email' => $params['clientdetails']['email']
            )
        ),
        'amount' => intval($params['amount'] * 100),
        'currency' => $params['currency'],
        'order_number' => $params['invoiceid'],
        'order_description' => 'Invoice #' . $params['invoiceid'],
        'items' => array(
            array(
                'name' => 'Invoice #' . $params['invoiceid'],
                'amount' => intval($params['amount'] * 100),
                'count' => 1
            )
        ),
        'callback' => array(
            'return_url' => $params['returnurl'],
            'notification_url' => $params['systemurl'] . '/modules/gateways/callback/gopay.php'
        ),
        'lang' => isset($params['language']) ? $params['language'] : 'CS'
    );
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $paymentUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($paymentData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Accept: application/json',
        'Content-Type: application/json',
        'Authorization: Bearer ' . $tokenResult['access_token']
    ));
    
    $paymentResponse = curl_exec($ch);
    $paymentResult = json_decode($paymentResponse, true);
    curl_close($ch);
    
    if (isset($paymentResult['gw_url'])) {
        return '<script>window.location.href="' . $paymentResult['gw_url'] . '";</script>';
    }
    
    return '<div class="alert alert-danger">GoPay payment creation failed</div>';
}

function gopay_callback($params) {
    $paymentId = $_GET['id'] ?? null;
    
    if (!$paymentId) {
        return false;
    }
    
    $isTest = ($params['test_mode'] === 'yes');
    $apiUrl = $isTest ? 'https://gw.sandbox.gopay.com/api' : 'https://gate.gopay.cz/api';
    
    // Get access token
    $tokenUrl = $apiUrl . '/oauth2/token';
    $tokenData = array(
        'grant_type' => 'client_credentials',
        'scope' => 'payment-read'
    );
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $tokenUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($tokenData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Accept: application/json',
        'Content-Type: application/x-www-form-urlencoded',
        'Authorization: Basic ' . base64_encode($params['client_id'] . ':' . $params['client_secret'])
    ));
    
    $tokenResponse = curl_exec($ch);
    $tokenResult = json_decode($tokenResponse, true);
    curl_close($ch);
    
    if (!isset($tokenResult['access_token'])) {
        return false;
    }
    
    // Get payment status
    $statusUrl = $apiUrl . '/payments/payment/' . $paymentId;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $statusUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Accept: application/json',
        'Authorization: Bearer ' . $tokenResult['access_token']
    ));
    
    $statusResponse = curl_exec($ch);
    $statusResult = json_decode($statusResponse, true);
    curl_close($ch);
    
    if (isset($statusResult['state']) && $statusResult['state'] === 'PAID') {
        addInvoicePayment($statusResult['order_number'], $paymentId, $statusResult['amount'] / 100, 0, 'gopay');
        logTransaction('gopay', $statusResult, 'Successful');
        return true;
    }
    
    return false;
}

function gopay_refund($params) {
    // GoPay refund implementation would go here
    return array('status' => 'success', 'rawdata' => 'Refund processed');
}
?>
