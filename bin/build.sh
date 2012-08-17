#/bin/sh
MYDIR=`cd \`dirname "$0"\`; pwd`
. $MYDIR/../appetizer.sh
appetizer build "$1" "$2"

echo "Project build in $1"