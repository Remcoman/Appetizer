#!/bin/bash

TARGETDIR="$2"
if [ "$TARGETDIR" ]; then
	cd $TARGETDIR
else
	TARGETDIR=`pwd`
fi

MYDIR=`dirname "$0"`

ACTION="$1"
if [ ! "$ACTION" ]; then
	ACTION="help"
fi

case $ACTION in
	"build" )
		if [! -d "$TARGETDIR/build"]; then
		    mkdir "$TARGETDIR/build"
		fi
		rm -r "$TARGETDIR/build/*"
		cp -r "$TARGETDIR/src/*" "$TARGETDIR/build"
		node "$MYDIR/lib/build.js" "$TARGETDIR"
	;;

	"start" )
		node "$MYDIR/lib/server.js" start "$TARGETDIR/src"
	;;

	"stop" )
		node "$MYDIR/lib/server.js" stop "$TARGETDIR/src"
	;;
	
	"create" )
		cp "$MYDIR/config.json" "$TARGETDIR/"
		mkdir "$TARGETDIR/src"
		mkdir "$TARGETDIR/build"
	;;
	
	"help" )
		echo
		echo "Appetizer"
		echo
		echo "Usage:"
		echo "	appetizer start			Start the development server"
		echo "	appetizer stop			Stop the development server"
		echo "	appetizer build			Build and minify all js and less files"
	;;
esac