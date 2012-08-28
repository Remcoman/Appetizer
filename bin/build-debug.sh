#/bin/sh
MYDIR=`cd \`dirname "$0"\`; pwd`
. $MYDIR/../appetizer.sh
appetizer build-debug "$1"

echo "Project build in $1"