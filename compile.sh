#!/bin/bash


BUILD_DIR="build/"
MAIN_FILE="main.ts"
echo "I'm compiling the following files:main.ts"


tsc --target "ES5" --module "amd" $MAIN_FILE

echo "All files compiled"
echo "Now moving generated files to the build directory..."

targets=(`find -maxdepth 1 -name "*.js"`)

for file in ${targets[@]} ; do
    mv $file $BUILD_DIR
done

echo "Successfully compiled!"
