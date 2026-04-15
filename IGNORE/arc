#!/usr/bin/env bash

# --- The Architect: Project Scaffolder ---
# Usage: ./architect.sh <project_name> <type: py|js|go>

set -e

readonly PROJECT_NAME=$1
readonly TYPE=$2
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly NC='\033[0m' # No Color

usage() {
    printf "${RED}Usage:${NC} architect <name> <py|js|go>\n"
    exit 1
}

[[ -z "$PROJECT_NAME" || -z "$TYPE" ]] && usage

printf "${GREEN}🔨 Building $PROJECT_NAME ($TYPE)...${NC}\n"

# Create core structure
mkdir -p "$PROJECT_NAME"/{src,tests,docs,scripts}
cd "$PROJECT_NAME"

# Initialize Git
git init -q

# Logic gate for language-specific setup
case "$TYPE" in
    py)
        touch src/main.py tests/test_main.py requirements.txt
        printf "import sys\n\ndef main():\n    print('System initialized')\n\nif __name__ == '__main__':\n    main()" > src/main.py
        python3 -m venv venv
        echo "venv/" > .gitignore
        ;;
    js)
        npm init -y > /dev/null
        mkdir -p src/utils
        touch src/index.js .env
        echo "node_modules/" > .gitignore
        ;;
    go)
        go mod init "$PROJECT_NAME" 2>/dev/null
        touch main.go
        ;;
    *)
        printf "${RED}Unknown type. Use py, js, or go.${NC}\n"
        exit 1
        ;;
esac

# Common files
echo "# $PROJECT_NAME" > README.md
echo "Created on $(date)" >> README.md
printf "bin/\nbuild/\n.DS_Store\n*.log" >> .gitignore

printf "${GREEN}✅ Project '$PROJECT_NAME' is ready to code.${NC}\n"
