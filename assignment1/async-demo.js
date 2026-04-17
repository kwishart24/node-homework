const fs = require("fs");
const path = require("path");

// Write a sample file for demonstration

// 1. Callback style

const sampleFilePath = path.join(__dirname, "sample-files", "sample.txt");

fs.writeFile(sampleFilePath, "Hello, async world!", (err) => {
  if (err) {
    console.log("file open failed: ", err.message);
  } else {
    console.log("File created successfully!");

    fs.readFile(sampleFilePath, { encoding: "utf8" }, (err, data) => {
      if (err) {
        console.log("file open failed: ", err.message);
      } else {
        //const string = data.toString();
        console.log("Callback read: ", data);
      }
    });
  }
});

// Callback hell example (test and leave it in comments):

// //1st level: reading the file
// fs.readFile(sampleFilePath, (err, data) => {
//   if (err) {
//     console.log("file open failed: ", err.message);
//   } else {
//     const string = data.toString();
//     console.log("1st Callback read: ", string);

//     //2nd level: writing the file
//     const content = "Hello from callback Hell";
//     fs.writeFile(sampleFilePath, content, (err) => {
//       if (err) {
//         console.log("file rewrite failed: ", err.message);
//       } else {
//         console.log("2nd callback writes: ", content);

//         //3rd level: reading the file
//         fs.readFile(sampleFilePath, (err, data) => {
//           if (err) {
//             console.log("file open failed: ", err.message);
//           } else {
//             const string = data.toString();
//             console.log("3rd Callback read: ", string);
//           }
//         });
//       }
//     });
//   }
// });

// 2. Promise style

const fsp = require("fs/promises");

const doFileOperations = async () => {
  try {
    const fileHandle = await fsp.readFile(sampleFilePath);
    console.log("Promise read: ", fileHandle.toString());
  } catch (err) {
    console.log("An error occurred.", err);
  }
};

doFileOperations();

// 3. Async/Await style
const { promisify } = require("util");
const fnWithPromise = promisify(fs.readFile);

async function doSomething() {
  try {
    const result = await fnWithPromise(sampleFilePath);
    console.log("Async/Await read: ", result.toString());
  } catch (err) {
    console.log("An error occurred.", err);
  }
}

doSomething();
