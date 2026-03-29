const fs = require("fs");
//const path = require("path");

// Write a sample file for demonstration

// 1. Callback style

fs.readFile("./sample-files/sample.txt", { encoding: "utf8" }, (err, data) => {
  if (err) {
    console.log("file open failed: ", err.message);
  } else {
    //const string = data.toString();
    console.log("Callback read: ", data);
  }
});

// Callback hell example (test and leave it in comments):

// //1st level: reading the file
// fs.readFile("./sample-files/sample.txt", (err, data) => {
//   if (err) {
//     console.log("file open failed: ", err.message);
//   } else {
//     const string = data.toString();
//     console.log("1st Callback read: ", string);

//     //2nd level: writing the file
//     const content = "Hello from callback Hell";
//     fs.writeFile("./sample-files/sample.txt", content, (err) => {
//       if (err) {
//         console.log("file rewrite failed: ", err.message);
//       } else {
//         console.log("2nd callback writes: ", content);

//         //3rd level: reading the file
//         fs.readFile("./sample-files/sample.txt", (err, data) => {
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

// 3. Async/Await style
