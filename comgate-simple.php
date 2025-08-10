<?php
function comgate_config() {
    return array(
        'name' => 'Comgate Payment Gateway',
        'description' => 'Accept payments via Comgate - cards, bank transfers, and alternative payment methods',
        'version' => '1.0.0',
        'author' => 'HostBill Comgate Module',
        'fields' => array(
            'merchant_id' => array(
                'name' => 'Merchant ID',
                'description' => 'Your Comgate Merchant ID',
                'type' => 'text',
                'required' => true
            ),
            'secret_key' => array(
                'name' => 'Secret Key',
                'description' => 'Your Comgate Secret Key',
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

function comgate_link($params) {
    $form = '<form method="post" action="https://payments.comgate.cz/v1.0/create">';
    $form .= '<input type="hidden" name="merchant" value="' . $params['merchant_id'] . '">';
    $form .= '<input type="hidden" name="price" value="' . intval($params['amount'] * 100) . '">';
    $form .= '<input type="hidden" name="curr" value="' . $params['currency'] . '">';
    $form .= '<input type="hidden" name="label" value="Invoice #' . $params['invoiceid'] . '">';
    $form .= '<input type="hidden" name="refId" value="' . $params['invoiceid'] . '">';
    $form .= '<input type="hidden" name="test" value="' . ($params['test_mode'] === 'yes' ? 'true' : 'false') . '">';
    $form .= '<input type="submit" value="Pay with Comgate" class="btn btn-primary">';
    $form .= '</form>';
    return $form;
}

function comgate_callback($params) {
    if (isset($_POST['status']) && $_POST['status'] === 'PAID') {
        addInvoicePayment($_POST['refId'], $_POST['transId'], $_POST['price'] / 100, 0, 'comgate');
        return true;
    }
    return false;
}
?>
