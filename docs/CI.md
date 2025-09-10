# CI/CD - Jenkins

This template has examples of a [Jenkinsfile_CNP](https://github.com/hmcts/tcoe-playwright-example/blob/master/Jenkinsfile_CNP) and [Jenkinsfile_nightly](https://github.com/hmcts/tcoe-playwright-example/blob/master/Jenkinsfile_nightly)

The \_CNP file runs on your branches / prior to you merging any code (things like linting/formatting)

The \_nightly file is used to run your scheduled tests (regression etc) - this can also be parameterized so that you could choose which tests and browsers to run specifically ([TODO](https://github.com/hmcts/tcoe-playwright-example/issues/45))

## Parameters

You can define parameters for your pipeline like so:

```groovy
properties([
  ...
  parameters([
    string(
      name: 'TAG_TO_RUN',
      defaultValue: '@all',
      description: 'The tag you want to run'
    ),
    ...
  ])
  ...
])
```

Likewise, you can also extend these further for URL's, number of parallel workers or which browsers to run etc. Note that the default values will be used for your scheduled build.

Also if you have made a change to your pipeline properties, they will only be picked up once Jenkins has run the same pipeline. So if you make a change and start a build, that build will not have your changes. However, the build after that will.

## Schedule

Jenkins pipelines are triggered in a cron format e.g. [here](https://github.com/hmcts/tcoe-playwright-example/blob/master/Jenkinsfile_nightly#L7) - the schedule used in this template is not a daily schedule, so you will need to change that if using this example.

## Secrets

In order for certain environment variables to be available in Jenkins, you should add them to your key vault (depending on environment and team).

You also need to create a list of those secrets in your Jenkinsfile e.g:

```groovy
def secrets = [
  'prl-${env}': [
    secret('solicitor-user', 'SOLICITOR_USERNAME'),
    secret('solicitor-password', 'SOLICITOR_PASSWORD'),
    ...
  ]
]
```

Then, you need to pass them to the "loadVaultSecrets()" function:

```groovy
withNightlyPipeline(type, product, component, 600) {
  ...
  loadVaultSecrets(secrets)
  ...
}
```

For local usage, you can run `yarn load-secrets` [(see package.json)](https://github.com/hmcts/tcoe-playwright-example/blob/master/package.json#L31) which runs a script that comes directly from the playwright-common library which will populate your .env file based on your .env.example file.

## Publishing reports

There is a function available to publish reports:

```groovy
publishHTML([
  allowMissing: true,
  alwaysLinkToLastBuild: true,
  keepAll: true,
  reportDir: "playwright-report",
  reportFiles: 'index.html',
  reportName: 'Chrome E2E Tests'
])
```

This may need to be modified depending on where you store your reports, it must point towards a HTML report.

## Why is withNightlyPipeline used in the Jenkinsfile_CNP?

If your repo is only used to store your tests, you will not need to use the "withPipeline" functionality. This wrapper has the ability to push containers for ACR and check helm charts which is not needed if you only store tests inside a given repo.

Your CNP file will be different if your tests are stored with product code as these additional steps are required.
