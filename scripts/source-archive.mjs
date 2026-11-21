import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const files = ['README.md', 'package.json', 'LICENSE', 'src/simulator.mjs', 'src/cli.mjs', 'test/simulator.test.mjs'];
const repository = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const root = path.join(repository, 'afksix-core');
const output = path.join(repository, '_site', 'source', 'afksix-core.zip');
const local = [];
const central = [];
let offset = 0;

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

for (const file of files) {
  const name = Buffer.from(`afksix-core/${file}`);
  const data = fs.readFileSync(path.join(root, file));
  const crc = crc32(data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x800, 6);
  header.writeUInt16LE(0, 8); // Stored; source files are small.
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(data.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(name.length, 26);
  local.push(header, name, data);

  const directory = Buffer.alloc(46);
  directory.writeUInt32LE(0x02014b50, 0);
  directory.writeUInt16LE(20, 4);
  directory.writeUInt16LE(20, 6);
  directory.writeUInt16LE(0x800, 8);
  directory.writeUInt16LE(0, 10);
  directory.writeUInt32LE(crc, 16);
  directory.writeUInt32LE(data.length, 20);
  directory.writeUInt32LE(data.length, 24);
  directory.writeUInt16LE(name.length, 28);
  directory.writeUInt32LE(offset, 42);
  central.push(directory, name);
  offset += header.length + name.length + data.length;
}

const directorySize = central.reduce((size, chunk) => size + chunk.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directorySize, 12);
end.writeUInt32LE(offset, 16);
fs.writeFileSync(output, Buffer.concat([...local, ...central, end]));
