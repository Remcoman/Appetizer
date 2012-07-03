Very simple webapp framework.
====

Step 1: development
====

1. Install nodejs
2. Start the server (./start.sh)
3. Put your Less style in src/styles/index.less
4. Put your JavaScript in src/styles/index.js
5. Visit http://localhost:8000.
6. That's all

Step 2: deployment
====
1. Execute the build script (./build.sh)
2. Your code is in the build folder (CSS, JavaScript is minified)
3. That's all

Why is there only one Less and JavaScript file?
====
index.less and index.js are your entry files. For Less you can use @import statements to include other less files.
For JavaScript you can use the CommonJS module format to 'require' other js files.