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
	ACTION="start"
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
		node "$MYDIR/lib/server.js" start "$TARGETDIR"
	;;

	"stop" )
		node "$MYDIR/lib/server.js" stop "$TARGETDIR"
	;;
esac