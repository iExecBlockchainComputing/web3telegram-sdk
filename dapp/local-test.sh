# Set the name of the Docker image
IMG_NAME=web3telegram:non-tee

# Build the regular non-TEE image
docker build . -t ${IMG_NAME}

# Create input/output directories if they do not exist
if [ ! -d "./tmp/iexec_in" ]; then
  mkdir -p ./tmp/iexec_in
fi

if [ ! -d "./tmp/iexec_out" ]; then
  mkdir -p ./tmp/iexec_out
fi

# Place your .zip file in the /tmp/iexec_in directory and replace DATA_FILENAME with the name of the file you just placed in the directory
# The .zip file should contain a file with the chat ID you want to protect
DATA_FILENAME="data-chatId.zip"

TOKEN="7816806143:AAHCeDN_RFHFowOv0RRTVvzCsSDn-IxpU7o"
MESSAGE="hellosdk"

IEXEC_APP_DEVELOPER_SECRET='{"TELEGRAM_BOT_TOKEN":"'$TOKEN'"}'
IEXEC_REQUESTER_SECRET_1='{"message":"'$MESSAGE'"}'

docker run -it --rm \
            -v ./tmp/iexec_in:/iexec_in \
            -v ./tmp/iexec_out:/iexec_out \
            -e IEXEC_IN=/iexec_in \
            -e IEXEC_OUT=/iexec_out \
            -e IEXEC_DATASET_FILENAME=${DATA_FILENAME} \
            -e IEXEC_APP_DEVELOPER_SECRET=${IEXEC_APP_DEVELOPER_SECRET} \
            -e IEXEC_REQUESTER_SECRET_1=${IEXEC_REQUESTER_SECRET_1} \
            ${IMG_NAME} 