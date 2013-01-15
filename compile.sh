#!/bin/bash


if [ "$1" = "test" ] ; then
    BUILD_DIR="tests/build/"
    MAIN_FILE="tests/TestMain.ts"
    SOURCES=`find -maxdepth 1 -name "tests/*.ts`
else
    BUILD_DIR="./build/"
    MAIN_FILE="main.ts"
    SOURCES=`find -maxdepth 1 -name "*.ts"`
fi

echo "I'm compiling the following files:${SOURCES[@]}"


tsc --target "ES5" --module "amd" $MAIN_FILE

if [ $? -ne 0 ] ; then
    echo "Some files failed to compile. Terminating the process..."
    exit 1
fi

echo "All files compiled"
echo "Now moving generated files to the build directory..."

if [ "$1" = "test" ] ; then
    TARGETS=(`find -maxdepth 1 -name "tests/*.js"`)
else
    TARGETS=(`find -maxdepth 1 -name "*.js"`)
fi

echo "First clean the build directory..."
rm "$BUILD_DIR*"

echo "And then move..."
for FILE in ${TARGETS[@]} ; do
    mv -u $FILE $BUILD_DIR
done

echo "Successfully compiled!"
