# cpaas-comparison

CPaaS (Communications Platform as a Service) の選定のための module
npm package として提供するが npm に登録することはしない
ACALL の github package にするのがいいかと

## Project setup

```
yarn install
```

### Compiles and hot-reloads for development

```
yarn serve
```

### Compiles and minifies for production

```
yarn build
```

### Run your unit tests

```
yarn test:unit
```

### Run your end-to-end tests

```
yarn test:e2e
```

### Lints and fixes files

```
yarn lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

### env.local

add

```env
# ConnectyCube
VUE_APP_CC_APP_ID=*****
VUE_APP_CC_AUTH_KEY=*****
VUE_APP_CC_SECRET=*****
VUE_APP_CC_USER_1_LOGIN=*****
VUE_APP_CC_USER_1_PASSWORD=*****
VUE_APP_CC_USER_1_ID=*****
VUE_APP_CC_USER_2_LOGIN=*****
VUE_APP_CC_USER_2_PASSWORD=*****
VUE_APP_CC_USER_2_ID=*****

# QuickBlox
VUE_APP_QB_APP_ID=*****
VUE_APP_QB_AUTH_KEY=*****
VUE_APP_QB_SECRET=*****
VUE_APP_QB_ACCOUNT_KEY=*****
VUE_APP_QB_USER_1_LOGIN=*****
VUE_APP_QB_USER_1_PASSWORD=*****
VUE_APP_QB_USER_1_ID=*****
VUE_APP_QB_USER_2_LOGIN=*****
VUE_APP_QB_USER_2_PASSWORD=*****
VUE_APP_QB_USER_2_ID=*****

# SkyWay
VUE_APP_SW_KEY=*****
```

### package build

GithubPackages

```shell
npm run build-bundle
npm publish
```
