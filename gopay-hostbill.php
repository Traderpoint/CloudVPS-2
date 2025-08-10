<?php
function gopay_config() {
    return array(
        'name' => 'GoPay Payment Gateway',
        'description' => 'Accept payments via GoPay - cards, bank transfers, and alternative payment methods',
        'version' => '1.0.0',
        'author' => 'HostBill GoPay Module',
        'fields' => array(
            'goid' => array(
                'name' => 'GoID',
                'description' => 'Your GoPay GoID',
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
                'description' => 'Enable test mode',
                'type' => 'yesno',
                'default' => 'yes'
            )
        )
    );
}

function gopay_link($params) {
    $form = '<form method="post" action="https://gate.gopay.cz/gw/pay-full-v2">';
    $form .= '<input type="hidden" name="targetGoId" value="' . $params['goid'] . '">';
    $form .= '<input type="hidden" name="totalPrice" value="' . intval($params['amount'] * 100) . '">';
    $form .= '<input type="hidden" name="currency" value="' . $params['currency'] . '">';
    $form .= '<input type="hidden" name="orderNumber" value="' . $params['invoiceid'] . '">';
    $form .= '<input type="hidden" name="productName" value="Invoice #' . $params['invoiceid'] . '">';
    $form .= '<input type="submit" value="Pay with GoPay" class="btn btn-primary">';
    $form .= '</form>';
    return $form;
}

function gopay_callback($params) {
    if (isset($_POST['result']) && $_POST['result'] === 'FINISHED') {
        addInvoicePayment($_POST['orderNumber'], $_POST['paymentSessionId'], $_POST['totalPrice'] / 100, 0, 'gopay');
        return true;
    }
    return false;
}
?>
