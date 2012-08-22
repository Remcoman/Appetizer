#/bin/sh

#This file is heavily inspired by nvm.sh at https://github.com/creationix/nvm/blob/master/nvm.sh

#directory of this file
if [ ! -d "$APPETIZER_DIR" ]; then
	export APPETIZER_DIR=`dirname "${BASH_SOURCE[0]}"`
fi

appetizer()
{
	#the action
	ACTION="$1"
	if [ ! "$ACTION" ]; then
		ACTION="help"
	fi

	#the target directory to start all actions in
	TARGET_DIR="$2"
	if [ "$TARGET_DIR" ]; then
		cd $TARGET_DIR
	else
		TARGET_DIR=`pwd`
	fi

	if [ "$ACTION" = "build" ]; then
		ACTION="build_release"
	fi

	case $ACTION in
		"build-release" )
			if [ ! -d "$TARGET_DIR/build" ]; then
				mkdir "$TARGET_DIR/build"
			fi

			rm -r "$TARGET_DIR/build"
			mkdir "$TARGET_DIR/build"
			node "$APPETIZER_DIR/lib/build.js" "$TARGET_DIR" release
		;;

		"build-debug" )
			if [ ! -d "$TARGET_DIR/build" ]; then
				mkdir "$TARGET_DIR/build"
			fi

			rm -r "$TARGET_DIR/build"
			mkdir "$TARGET_DIR/build"
			node "$APPETIZER_DIR/lib/build.js" "$TARGET_DIR" debug
		;;

		"start" )
			node "$APPETIZER_DIR/lib/server.js" start "$TARGET_DIR"
		;;

		"stop" )
			node "$APPETIZER_DIR/lib/server.js" stop "$TARGET_DIR"
		;;

		"make" )
			if [ "$(ls $TARGET_DIR)" ]; then
				while true; do
					read -p "Directory not emty. Do you really want to make here? " yn
					case $yn in
						[Yy]* ) break;;
						[Nn]* ) return;;
						* ) echo "Please answer yes or no.";;
					esac
				done
			fi

			cp "$APPETIZER_DIR/config.json" "$TARGET_DIR"

			if [ ! -d "$TARGET_DIR/src" ]; then
				mkdir "$TARGET_DIR/src"
			fi

			#make copies all template files to the target directory
			cp -r "$APPETIZER_DIR"/template/* "$TARGET_DIR"

			if [ ! -d "$TARGET_DIR/build" ]; then
				mkdir "$TARGET_DIR/build"
			fi

			echo "Project made in $TARGET_DIR"
		;;

		"help" )
			echo
			echo "Appetizer"
			echo
			echo "Usage:"
			echo "	appetizer make			Creates a project according to a template"
			echo "	appetizer start			Start the development server"
			echo "	appetizer stop			Stop the development server"
			echo "	appetizer build-debug		Build all js and less files into the 'build' folder of the project. Keeps debugging code"
			echo "	appetizer build-release		Like build-debug only it obfuscates all js en minifies the css"
		;;

		* )
			appetizer help
		;;
	esac
}