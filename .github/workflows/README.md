# GitHub Workflows - Web3Telegram SDK

Complete documentation of GitHub Actions workflows for the Web3Telegram SDK project.

## 📋 Overview

The project uses 3 categories of workflows:

- **SDK** : CI, build, NPM publication of the SDK
- **DApp** : CI and application deployment
- **Release** : Version management and releases

## 🚀 SDK Workflows

### `sdk-ci.yml`

**SDK CI** - Automatic validation on every PR

- **Trigger** : Pull Request on `src/`, `tests/`, configs
- **Actions** : Lint, unit tests, TypeScript build
- **Concurrency** : Cancels previous runs

### `sdk-npm-publish.yml`

**Manual NPM Publication** - Deploy to NPM

- **Trigger** : `workflow_dispatch`
- **Inputs** : `tag` (latest/nightly)
- **Restriction** : `main` branch only

### `sdk-release.yml`

**Automatic NPM Publication** - Official release

- **Trigger** : Tag `web3telegram-v*`
- **Action** : Publication with `latest` tag

### `reusable-sdk-npm.yml`

**Reusable Workflow** - Template for NPM publication

- **Type** : `workflow_call`
- **Usage** : Used by `sdk-npm-publish.yml` and `sdk-release.yml`

## 🏗️ DApp Workflows

### `dapp-ci.yml`

**Application CI** - DApp code validation

- **Trigger** : Pull Request on `dapp/`
- **Actions** : Lint, tests, validation

### `deployment/deployment-dapp-ci.yml`

**Deployment CI** - Deployment scripts validation

- **Trigger** : Pull Request on `deployment-dapp/`
- **Actions** : Lint, TypeScript scripts tests

## 🚀 Deployment Workflows

### `dapp-deploy.yml` (Main)

**Complete Deployment**

- **Trigger** : `workflow_dispatch`
- **Inputs** : `environment` (bellecour-dev, arbitrum-sepolia-dev, etc.)
- **Process** :
  1. Docker build + Sconify
  2. Contract deployment
  3. Push secrets
  4. Publish sell order
  5. Whitelist
  6. ENS configuration

### `01-deploy-dapp-contract.yml`

**Contract Deployment** - Deploy the smart contract

- **Trigger** : `workflow_dispatch`
- **Inputs** : `environment`, `docker_image_tag`, `checksum`, `fingerprint`
- **Outputs** : `app_address`

### `02-push-dapp-secret.yml`

**Push Secrets** - Push secrets to SMS (Secret Management Service)

- **Trigger** : `workflow_dispatch`
- **Inputs** : `environment`, `app_address`

### `03-publish-sell-order.yml`

**Sell Order** - Publish a free sell order

- **Trigger** : `workflow_dispatch`
- **Inputs** : `environment`, `app_address`, `price`, `volume`

### `04-add-resource-whitelist.yml`

**Whitelist** - Add app to a whitelist already deployed on whitelist-smartcontract repo and transfer ownership to web3telegram wallet

- **Trigger** : `workflow_dispatch`
- **Inputs** : `environment`, `app_address`, `whitelist_contract_address`

### `05-configure-ens.yml`

**ENS Configuration** - Configure ENS name (only on bellecour environment)

- **Trigger** : `workflow_dispatch`
- **Inputs** : `environment`, `app_address`, `ens_name`

## 📦 Release Workflows

### `release.yml`

**Release Please** - Automatic version management

- **Trigger** : Push on `main`
- **Action** : Automatic release PR creation

### `conventional-commits.yml`

**Commit Validation** - Check conventional commits

- **Trigger** : Pull Request
- **Action** : Commit format validation

## 🎯 Usage

### Complete Deployment

```bash
gh workflow run dapp-deploy.yml -f environment=bellecour-dev
```

### SDK Publication

```bash
# Manual publication
gh workflow run sdk-npm-publish.yml -f tag=nightly

# Automatic publication (via tag)
git tag web3telegram-v1.0.0
git push origin web3telegram-v1.0.0
```

## 🔧 Environments

| Environment             | Network           | Usage           |
| ----------------------- | ----------------- | --------------- |
| `bellecour-dev`         | Bellecour Testnet | Development     |
| `arbitrum-sepolia-dev`  | Arbitrum Sepolia  | Testing         |
| `bellecour-prod`        | Bellecour Mainnet | Production      |
| `arbitrum-sepolia-prod` | Arbitrum Sepolia  | Production test |
| `arbitrum-prod`         | Arbitrum Mainnet  | Production      |

## 📁 Structure

```
.github/workflows/
├── sdk-ci.yml                    # SDK CI
├── sdk-npm-publish.yml          # Manual NPM publication
├── sdk-release.yml              # Automatic NPM publication
├── reusable-sdk-npm.yml         # NPM template
├── dapp-ci.yml                  # DApp CI
├── release.yml                  # Release Please
├── conventional-commits.yml     # Commit validation
├── dapp-deploy.yml              # Main orchestrator
├── 01-deploy-dapp-contract.yml  # Contract deployment
├── 02-push-dapp-secret.yml      # Push secrets
├── 03-publish-sell-order.yml    # Publish sell order
├── 04-add-resource-whitelist.yml # Whitelist app
├── 05-configure-ens.yml         # Configure ENS
└── deployment-dapp-ci.yml       # Deployment CI
```

## ⚡ Benefits

- **Modularity** : Each step can be executed independently
- **Recovery** : In case of failure, restart only the concerned step
- **Flexibility** : Reusable and configurable workflows
- **Security** : Automatic validation and separate environments
- **Traceability** : Detailed logs for each step
