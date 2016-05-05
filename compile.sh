#!/bin/bash


if [ "$1" = "test" ] ; then
    BUILD_DIR="tests/build/"
    MAIN_FILE="tests/TestMain.ts"
    TARGET_DIR="tests/"
    SOURCES=`find $TARGET_DIR -maxdepth 1 -name "*.ts"`
else
    BUILD_DIR="build/"
    MAIN_FILE="main.ts"
    TARGET_DIR="."
    SOURCES=`find $TARGET_DIR -maxdepth 1 -name "*.ts"`
fi

echo "I'm compiling the following files:${SOURCES[@]}"


tsc --target "ES5" --module "amd" $MAIN_FILE

if [ $? -ne 0 ] ; then
    echo "Some files failed to compile. Terminating the process..."
    exit 1
fi

echo "All files compiled"
echo "Now moving generated files to the build directory..."

TARGETS=(`find $TARGET_DIR -maxdepth 1 -name "*.js"`)

echo "First clean the build directory..."
rm "$BUILD_DIR*"

echo "And then move..."
for FILE in ${TARGETS[@]} ; do
    mv -u $FILE $BUILD_DIR
done

echo "Successfully compiled!"
