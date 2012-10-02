#/bin/sh
MYDIR=`cd \`dirname "$0"\`; pwd`
. $MYDIR/../appetizer.sh
appetizer build-release "$1"