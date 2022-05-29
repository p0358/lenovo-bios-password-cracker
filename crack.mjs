import * as fs from "fs";
import { argv } from "process";

console.log("Lenovo sussy baka BIOS password cracker by p0358");
console.log("================================================");

if (argv.length !== 3) {
    console.log("Usage: node crack.mjs <filename>.bin");
    console.log("Read readme to find out how to obtain the bin file...");
    process.exit(1);
}

let filename = argv[2];

function loadFileAsync(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) return reject(err);
            return resolve(data);
        });
    });
}

/**
 * @param {Buffer} buffer 
 * @param {Function} test_callback 
 * @param {number} start_offset 
 * @returns {number | false}
 */
function findFragmentBuffer(buffer, test_callback, start_offset = 0) {
    const len = buffer.length;
    for (let i = start_offset; i < len; i++) {
        try {
            const result = test_callback(buffer, i);
            if (result) {
                //console.log(`Found match at byte ${i}`);
                return i;
            }
        } catch (e) {
            if (e instanceof RangeError) break;
            else throw e;
        }
    }
    return false;
}

const scancodes = {
    2: '1',
    3: '2',
    4: '3',
    5: '4',
    6: '5',
    7: '6',
    8: '7',
    9: '8',
    10: '9',
    11: '0',
    12: '-',
    13: '=',
    16: 'Q',
    17: 'W',
    18: 'E',
    19: 'R',
    20: 'T',
    21: 'Y',
    22: 'U',
    23: 'I',
    24: 'O',
    25: 'P',
    26: '[',
    27: ']',
    30: 'A',
    31: 'S',
    32: 'D',
    33: 'F',
    34: 'G',
    35: 'H',
    36: 'J',
    37: 'K',
    38: 'L',
    39: ';',
    40: '\'',
    41: '`',
    43: '\\',
    44: 'Z',
    45: 'X',
    46: 'C',
    47: 'V',
    48: 'B',
    49: 'N',
    50: 'M',
    51: ',',
    52: '.',
    53: '/',
    74: '-',
    78: '+'
};

(async function() {

    let buf = await loadFileAsync(filename);
    let pos = 0;

    let passwords = [];

    while (true) {
    
        let start = findFragmentBuffer(buf,
            /**
             * @param {Buffer} buffer 
             * @param {number} offset 
             * @returns {boolean}
             */
            (buffer, offset) => {
            
                let length = buffer.readUInt8(offset); offset += 1;
                // allowed password length between 1 and 8 (user is expected to check password length 0 themselves lol)
                if (length < 1 || length > 8) return false; 

                let sum = 0;
                let keys = [];

                for (let i = 0; i <= length; i++) {
                    const key = buffer.readUInt8(offset); offset += 1;
                    sum += key;
                    if (i !== length)
                        keys.push(key);
                }
                sum += length; // the length itself also counts to the checksum

                //if (sum === 0x100) { 
                if ((sum & 0xFF) === 0x00) { 
                    // that's a potential match!

                    // now check if password consists of only valid characters
                    for (const key of keys)
                        if (!Object.keys(scancodes).map(k=>+k).includes(key)) {
                            //console.log("INVALID", keys)
                            return false;
                        }
                    
                    const password = keys.map(k => scancodes[k]).join();
                    //console.log("VALID", keys, "=>", password);
                    passwords.push(password);
                    
                    return true;
                }
                return false;
            },
            pos
        );

        if (!start) break;
        pos = start + 1;
    
    }
    
    if (passwords.length) {
        console.table({"CRACKED PASSWORD": [...new Set(passwords)]});
    } else {
        console.error("Unfortunately could not crack any valid passwords from this file...");
    }
    
})();
