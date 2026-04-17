const os = require("os");
const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

const largeFilePath = path.join(sampleFilesDir, "largefile.txt");

const demoFilePath = path.join(sampleFilesDir, "demo.txt");

// OS module
const platform = os.platform();
const cpu = os.cpus();
const memory = os.totalmem();

console.log("Platform: ", platform);
console.log("CPU: ", cpu[0].model);
console.log("Total Memory: ", memory);
// // Path module
console.log("Joined path: ", sampleFilesDir);
// fs.promises API
const createNewFile = async () => {
  try {
    await fsp.writeFile(demoFilePath, "Hello from fs.promises!");

    const reading = await fsp.readFile(demoFilePath, {
      encoding: "utf-8",
    });

    console.log("fs.promises read: ", reading);
  } catch (err) {
    console.log("An error occurred.", err);
  }
};

createNewFile();

// Streams for large files- log first 40 chars of each chunk
const { createReadStream } = require("fs");
const { once } = require("events");

const newLargeFile = fs.createWriteStream(largeFilePath);

function readChunk(path, { highWaterMark = 512, maxChars = 40 }) {
  return new Promise((resolve, reject) => {
    const rs = createReadStream(largeFilePath, {
      highWaterMark,
    });
    let collected = "";
    let remaining = maxChars - collected.length;

    rs.on("error", reject);
    //rs.on("end", () => resolve(collected));
    rs.on("data", (chunk) => {
      let text = chunk.toString("utf8");
      let take = Math.min(text.length, remaining);

      collected += text.slice(0, take);

      remaining -= take;

      if (remaining <= 0) {
        rs.destroy();
        resolve(collected);
      }
    });
  });
}

async function createLargeFile() {
  try {
    for (let i = 0; i < 100; i++) {
      newLargeFile.write("I am looping over and over\n");
    }
    newLargeFile.end();

    await once(newLargeFile, "finish");

    const snippet = await readChunk(largeFilePath, {
      maxChars: 40,
      highWaterMark: 512,
    });
    console.log("Read chunk: ", snippet);
  } catch (err) {
    console.log("An error occurred.", err);
  } finally {
    console.log("Finished reading large file with streams.");
  }
}

createLargeFile();
