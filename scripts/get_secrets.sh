#!/bin/bash
# Change KEY_VAULT_NAME if you want to use a different environment
# Secrets must be tagged with "e2e": "ENV_VAR_NAME" in Azure Key Vault
# This script looks for the tagged secrets and creates an .env file based on the .env.example file

# Requires: Azure CLI & JQ (brew install azure-cli jq)

KEY_VAULT_NAME="prl-aat"
EXAMPLE_ENV_FILE=".env.example"
ENV_FILE=".env"
TEMP_ENV_FILE=$(mktemp)

secrets=$(az keyvault secret list --vault-name $KEY_VAULT_NAME --query "[].{id:id, tags:tags}" -o json)
echo "$secrets" | jq -c '.[]' | while read -r secret; do
    secret_id=$(echo $secret | jq -r '.id')
    tags=$(echo $secret | jq -r '.tags')
    if echo $tags | jq -e 'has("e2e")' > /dev/null; then
        env_var=$(echo $tags | jq -r '.e2e')
        secret_value=$(az keyvault secret show --id $secret_id --query "value" -o tsv)
        echo "Reading $(basename $secret_id) from $KEY_VAULT_NAME vault"
        echo "$env_var=$secret_value" >> $TEMP_ENV_FILE
    fi
done

if [ -f $EXAMPLE_ENV_FILE ]; then
    cp $EXAMPLE_ENV_FILE $ENV_FILE
    while IFS= read -r line || [ -n "$line" ]; do
        key=$(echo $line | cut -d '=' -f 1)
        value=$(grep "^$key=" $TEMP_ENV_FILE | cut -d '=' -f 2-)
        if [ -n "$value" ]; then
            echo "Setting $key"
            sed -i '' "s|^$key=.*|$key=$value|" $ENV_FILE
        fi
    done < $EXAMPLE_ENV_FILE
    echo ".env file created successfully."
else
    echo ".env.example file not found." && exit 1
fi

rm $TEMP_ENV_FILE
