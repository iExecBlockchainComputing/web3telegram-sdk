# Telegram-Sender-Dapp

Telegram-Sender-Dapp is a decentralized application (DApp) that securely and decentralizes telegram message sending using the IEXEC platform. The DApp reads a .zip file, extracts the recipient's telegram chat ID, and sends a message to that address using npde-telegram-bot-api. The DApp is executed as a Docker container that runs on an IEXEC worker node, ensuring complete confidentiality by decrypting protected data to retrieve the chat ID in an enclave.

## Running the Dapp locally

### Create .env file

Create a `.env` file in the root directory of the project based on the `.env.override` file

fill in the environment variables:

- **IEXEC_IN**: The path to the input directory on your local machine where the unencrypted data .zip file will be stored. This file contains the telegram chat ID address to which the message will be sent.
- **IEXEC_OUT**: The path on your local machine where the result of the Dapp execution will be written.
- **IEXEC_DATASET_FILENAME**: The name of the data file that you place in the **IEXEC_IN** directory.
- **IEXEC_APP_DEVELOPER_SECRET**: A JSON string with the following keys:
  - **TELEGRAM_BOT_TOKEN**: The API key of the telegram bot used to send the message.
- **IEXEC_REQUESTER_SECRET_1**: A JSON string with the following keys:
  - **telegramContentMultiAddr**: Multiaddress pointing to the encrypted message content to send.
  - **telegramContentEncryptionKey**: The encryption key used to encrypt the content.
  - **senderName**: The message sender name, it must be between 3 and 20 characters long. It will be displayed as "<senderName> via Web3Telegram" in the header of the message.

### Install dependencies

```bash
npm ci
```

### Start the app

```bash
npm run start-local
```

The Dapp will send a telegram message using the object and content specified in .env. The messsage will be sent to the address specified in data.zip in the IEXEC_IN directory.

## Running the Dapp locally using Docker

1.  **Build the Docker image**: Navigate to the `/web3telegram/dapp` directory of the project and run the following command to build the Docker image:

    ```sh
    docker build . --tag web3telegram-dapp
    ```

2.  **Create local directories**: In your terminal, execute the following commands to create two local directories on your machine:

    ```sh
    mkdir /tmp/iexec_in
    mkdir /tmp/iexec_out
    ```

3.  **Prepare your data**: Place your `data.zip` file inside the `/tmp/iexec_in` directory you just created. This file contains the data you want to protect, which in this case is the message you want to send. Ensure that the chatd iD is saved as a `chatId.txt` file within the `data.zip` archive.

4.  **Set up your telegram message content**: In the command provided in step 5, make sure to replace the placeholders:

    - `<telegram_content>`: The content of the message you want to send.

5.  **Run the Docker container**: Execute the following command to run the
    Docker container and execute the Dapp:

        ```sh
        docker run --rm \
            -v /tmp/iexec_in:/iexec_in \
            -v /tmp/iexec_out:/iexec_out \
            -e IEXEC_IN=/iexec_in \
            -e IEXEC_OUT=/iexec_out \
            -e IEXEC_DATASET_FILENAME=data.zip \
            IEXEC_REQUESTER_SECRET_1='{"telegramContentEncryptionKey":"telegram_content_encryption_key","telegramContentMultiAddr":"encrypted_telegram_content_multiaddress","senderName":"sender_name","contentType":"text/plain"}' \
            web3telegram-dapp
        ```

After running the Docker container, you can find the result of the Dapp's execution in the `/tmp/iexec_out` directory on your machine.

### Run Tests

- Create a `.env` file at the root of the project and set the environment variables.
- Create a `data.zip` file in the `tests/_tests_inputs_` directory with an chatId file containing the chat ID address to receive the message sent by the dapp.
- To run the tests, use `npm run test`.
  After running the tests, check the inbox of the chatId address specified in the chatId file in the `tests/_tests_inputs_` directory to receive the message sent by the dapp.
- To run the tests with code coverage, use `npm run ctest`.
