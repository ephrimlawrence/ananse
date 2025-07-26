## Language Syntax

```plaintext
[start] menu welcome {
  display "Welcome to our service!";
  get date_of_birth

  option 1 "Check Balance" -> sub_2;
  option 2 "Transfer Funds" -> transfer_funds.stage2;

  option /\d{1,3}/ "sdfsdf" -> testMe()
  option /\d{1,3}/ "sdfsdf" action testMe()

  option "0. Exit" -> exit;

  menu sub_2 {

    option "1. {{ welcome.input }}" action initiateTransfer(param1: x, param2: y)
  }
}

menu check_balance {
  display "Enter your account number:";
  input account_number;
  // Assuming an external function or API call to fetch balance
  action get_balance with {acct = account_number}; // not clear where the results is saved
  display "Your balance is: {{balance}}";
  option "0. Back" goto Welcome;
}



menu transfer_funds {
  display "Enter recipient's account number:";
  input recipient_account;

  display "Enter amount to transfer:";

  input amount;
  display "Confirm transfer of {{amount}} to {{recipient_account}}?";

  option "1. Confirm" action initiate_transfer(recipient_account, amount);
  option "2. Cancel" goto Welcome;
  option "0. Back" goto Welcome;
  option /[a-9]/: "Day" -> Welcome;
  option x: "Confirm" ->> initiateTransfer with { recipient: recipientAccount, amount: amount }

}

// Placeholder for actions (these would be implemented in your USSD gateway logic)
action get_balance(account) {
  // Logic to fetch and set the 'balance' variable
  // Example: balance = fetchBalanceFromAPI(account);
}

action initiate_transfer(recipient, amount) {
  // Logic to initiate the fund transfer
  // Example: callTransferAPI(recipient, amount);
  display "Transfer successful!";
}

exit {
  display "Thank you for using our service!";
}
```

Yes, absolutely! Allowing users to write action logic in JavaScript within your custom USSD language can bring significant flexibility and leverage the vast ecosystem and familiarity of JavaScript. Here are a few ways you could achieve this, along with their pros and cons:

## conditional branching Example

```plaintext
menu transfer_funds {
  if(var == 3){
  display "Enter recipient's account number:";
  } else {
    display "sdfsdf"
  }
  input recipient_account;
  display "Enter amount to transfer:";
  input amount;

  // --- CONDITIONAL BRANCHING ADDED HERE ---
  if (amount > 1000) {
    display "Transfer amount exceeds GHS 1,000. Do you want to proceed?";
    option "1. Yes" goto confirm_large_transfer;
    option "2. No" goto Welcome; // Go back to main menu
  } else {
    display "Confirm transfer of {{amount}} to {{recipient_account}}?";
    option "1. Confirm" action initiate_transfer(recipient_account, amount);
    option "2. Cancel" goto Welcome;
  }
  // --- END CONDITIONAL BRANCHING ---

  option "0. Back" goto Welcome; // This option will be available after the if/else
                                 // Or you might place it inside the branches if needed
}
```

## For loop
```plaintext
// --- FOR LOOP SYNTAX ADDED HERE (Dynamic Services Menu) ---
menu view_services {
  display "Available Services:";

  // Assume 'available_services' is a list of objects/maps,
  // e.g., [{id: "101", name: "Data Bundles"}, {id: "102", name: "Voice Packs"}]
  // We need an index for the option number.

  // Syntax: for each (item_variable, index_variable in collection_variable) { ... }
  // This will dynamically generate options based on the 'available_services' list.
  for each (service, i in available_services) {
    option "{{i}}. {{service.name}}" action select_service(service.id);
  }

  option "0. Back" goto dashboard;
}
// --- END FOR LOOP SYNTAX ---
```

1. Embedding JavaScript as String Literals within action Blocks:

You could modify your syntax to allow JavaScript code to be embedded as a string within the action block. Your interpreter would then need to execute this JavaScript.

```plaintext
menu transfer_funds {
  display "Enter recipient's account number:";
  input recipient_account;
  display "Enter amount to transfer:";
  input amount;
  display "Confirm transfer of {{amount}} to {{recipient_account}}?";
  option "1. Confirm" action {
    // JavaScript code as a string
    console.log("Initiating transfer...");
    let recipient = getVariable('recipient_account');
    let transferAmount = getVariable('amount');
    // Assuming a globally available function 'ussdBridge.transfer'
    let result = ussdBridge.transfer(recipient, transferAmount);
    if (result.success) {
      session.set('transfer_status', 'Successful!');
      session.get('transfer_status', 'Successful!');
      goto transfer_success;
    } else {
      setVariable('transfer_status', 'Failed: ' + result.error);
      goto transfer_failure;
    }
  };
  option "2. Cancel" goto Welcome;
  option "0. Back" goto Welcome;
}

menu transfer_success {
  display "Transfer {{transfer_status}}";
  option "0. Back" goto Welcome;
}

menu transfer_failure {
  display "Transfer {{transfer_status}}";
  option "0. Back" goto Welcome;
}
```

## Storing action result
```text
menu "Welcome" {
  display "Welcome to our service!";
  option "1. Check Balance" -> check_balance;
  option "2. Transfer Funds" -> transfer_funds;
  option "0. Exit" -> exit;
}

menu check_balance {
  display "Enter your account number:";
  input account_number;

  // --- NEW SYNTAX FOR STORING RETURN VALUE ---
  action get_balance with { account: account_number } as balance_data;

  // Now, use the stored variable to display information
  display "Your balance is: {{balance_data.amount}}";

  if (balance_data.status == "success") {
    display "Last updated: {{balance_data.timestamp}}";
  } else {
    display "Could not retrieve balance. Error: {{balance_data.error}}";
  }

  option "0. Back" -> Welcome;
}

menu transfer_funds {
  display "Enter recipient's account number:";
  input recipient_account
  {# goto confirm; #}

  display "Enter amount to transfer:";
  input amount;

  if (amount > 1000) {
    display "Transfer amount exceeds GHS 1,000. Do you want to proceed?";
    option "1. Yes" -> confirm_large_transfer;
    option "2. No" -> Welcome;
  } else {
    display "Confirm transfer of {{amount}} to {{recipient_account}}?";
    option "1. Confirm" action initiate_transfer with { recipient: recipient_account, amount: amount } as transfer_result; // Updated
    option "2. Cancel" -> Welcome;
  }
  option "0. Back" -> Welcome;
}

menu confirm_large_transfer {
  display "You are about to transfer GHS {{amount}} to {{recipient_account}}. Are you sure?";
  option "1. Confirm Transfer" action initiate_transfer with { recipient: recipient_account, amount: amount } as transfer_result; // Updated
  option "2. Cancel Transfer" -> Welcome;
}

// ... (other menus like view_services, dashboard, etc. would use this pattern where an action returns a value)

menu transfer_success {
  display "Transfer successful! Reference: {{transfer_result.reference}}"; // Assuming transfer_result has a reference
  option "0. Back" -> back;
}

menu transfer_failed {
  display "Transfer failed. Reason: {{transfer_result.error}}. Please try again.";
  option "0. Back" -> Welcome;
}


// --- Action Definitions ---
// These actions are assumed to be implemented externally (e.g., in a JS file)
// and *must return a value* for 'as variable_name' to work.

action get_balance(account) {
  // Example (conceptual):
  // return externalApi.fetchBalance(account); // Returns {amount: 500, status: "success", timestamp: "..."}
}

action initiate_transfer(recipient, amount) {
  // Example (conceptual):
  // return externalApi.performTransfer(recipient, amount); // Returns {success: true, reference: "XYZ"} or {success: false, error: "..."}
}

action select_service(serviceId) {
  // Example (conceptual):
  // return { message: "Service selected" };
}

exit {
  display "Thank you for using our service!";
}
```

## Jumping to different menu with 'goto'

```plaintext
menu "Welcome" {
  display "Welcome to our service!";
  // -> as shorthand for goto in options
  option "1. Check Balance" -> check_balance;
  option "2. Transfer Funds" -> transfer_funds;
  option "2. Transfer Funds" action transfer_funds;
  option "0. Exit" -> exit; // Using 'exit' as a special screen/state

  menu check_balance {
    action sdfsd(sd:23) ass result

    display "Enter your account number:";
    input account_number;
    // goto as explicit statement after input
    goto process_balance_request; // Go to a processing screen/state
  }
}


menu process_balance_request {
  // This screen is primarily for processing before displaying result
  action get_balance with { account: account_number } as balance_data;

  // Conditional branching based on action result, using goto
  if (balance_data.status == "success") {
    goto display_balance_success;
  } else {
    goto display_balance_failure;
  }
}

```

## End syntax

```text
menu "Welcome" {
  display "Welcome to our service!";
  option /9988/, "1. Check Balance" -> check_balance;
  option 0 "End Session" -> goodbye_screen; // Navigates to a screen that terminates
}

menu goodbye_screen {
  display "Thank you for using our service!";
  end ; // This menu automatically terminates the session after display
  end "message"; // end with a message
  // No options are needed or reachable after 'end;'
}

```

## External functions

```text
menu check_balance {
  // ...
  action AccountService.fetchBalance with { accountNumber = account_number } as balance_info;
  // ...
}

menu transfer_funds_confirmation {
  // ...
  option "1. Confirm" action TransferLogic.initiateTransfer with { ... } as transfer_response;
  // ...
}
```


## Menu scoped variable

```text
menu process_transaction {
  display "Processing your transaction...";
  action "transactionService.js:calculateFee" with {
    amount = transaction_amount
  } as _temp_fee_details; // _temp_fee_details is intended for this menu's use

  if (_temp_fee_details.status = "success") {
    display "Fee calculated: GHS {{_temp_fee_details.value}}.";
    display "Remaining balance: GHS {{_temp_fee_details.newBalance}}.";
    goto confirm_transaction;
  } else {
    display "Error calculating fee: {{_temp_fee_details.message}}.";
    goto transaction_failed_screen;
  }
  // _temp_fee_details is used here, but implicitly still in session
  // It wouldn't typically be referenced in 'confirm_transaction' unless specifically needed
}

menu confirm_transaction {
  // This menu would rely on 'transaction_amount', not typically '_temp_fee_details'
  display "Confirm transaction of GHS {{transaction_amount}}?";
  // ...
}
```
