# cp-action

github action: copy partial content from one repo to another

### how to use

```yml
name: Copy Code Workflow

on:
  push:
    branches:
      - main

jobs:
  copy-code:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout current repository
        uses: actions/checkout@v3

      - name: Copy Code
        uses: yuzhouu/cp-action@v0.0.9
        with:
          source-path: "path/to/source/code"
          target-repo: "target-owner/target-repo"
          target-path: "path/to/target/code"
          target-token: ${{ secrets.TARGET_REPO_TOKEN }}
```
