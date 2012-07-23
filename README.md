Very simple webapp framework.
====

Step 1: installation
====
1. Install nodejs
2. Clone this repository to a central location (for example /appetizer)
3. Source the appetizer.sh in your bash shell:

	`. /appetizer/appetizer.sh`

Step 2: development
====
1. Open terminal
2. cd to your project directory
3. Create your project:

	`appetizer make`

4. Start the development server:

	`appetizer start`

5. Put your Less style in src/styles/index.less
6. Put your JavaScript in src/scripts/index.js
7. Visit http://localhost:8000.
8. That's all

Step 3: deployment
====
1. Open terminal
2. cd to your project directory
3. Build it:

	`appetizer build`

4. Your code is in the build folder (CSS, JavaScript is minified)
5. That's all

Why is there only one Less and JavaScript file?
====
index.less and index.js are your entry files. For Less you can use @import statements to include other less files.
For JavaScript you can use the CommonJS module format to 'require' other js files.

TODO
====
Add support for a template language like Jade?