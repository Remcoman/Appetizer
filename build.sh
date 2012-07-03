#!/bin/sh
MYDIR=`cd \`dirname "$0"\`; pwd`
rm -r $MYDIR/build/*
cp -r $MYDIR/src/* $MYDIR/build
node build.js