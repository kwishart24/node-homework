const os = require("os");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
const platform = os.platform();
const cpu = os.cpus();
const memory = os.totalmem();

console.log("Platform: ", platform);
console.log("CPU: ", cpu[0].model);
console.log("Total Memory: ", memory);
// Path module
console.log("Joined path: ", sampleFilesDir);
// fs.promises API
const createNewFile = async () => {
  try {
    await fsp.writeFile("./sample-files/demo.txt", "Hello from fs.promises!");

    const reading = await fsp.readFile("./sample-files/demo.txt", {
      encoding: "utf-8",
    });

    console.log("fs.promises read: ", reading);
  } catch (err) {
    console.log("An error occurred.", err);
  }
};

createNewFile();

// Streams for large files- log first 40 chars of each chunk
