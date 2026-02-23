const fs = require('fs');

const files = [
    'LotteryService.gs',
    'SheetService.gs'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Replace standard (email && email...)
    content = content.replace(/var key = \(email && email !== ''\) \? email\.toLowerCase\(\) : name\.toLowerCase\(\);/g,
        "var key = CONFIG.GENERATE_KEY(name, email);");

    // Replace p.email
    content = content.replace(/var key = \(p\.email && p\.email !== ''\) \? p\.email\.toLowerCase\(\) : p\.name\.toLowerCase\(\);/g,
        "var key = CONFIG.GENERATE_KEY(p.name, p.email);");

    // Replace row[2]
    content = content.replace(/var key = \(row\[2\] && row\[2\] !== ''\) \? row\[2\]\.toLowerCase\(\) : row\[1\]\.toLowerCase\(\);/g,
        "var key = CONFIG.GENERATE_KEY(row[1], row[2]);");

    // Replace data[i][1]
    content = content.replace(/var key = \(data\[i\]\[1\] && data\[i\]\[1\] !== ''\) \? data\[i\]\[1\]\.toLowerCase\(\) : data\[i\]\[0\]\.toLowerCase\(\);/g,
        "var key = CONFIG.GENERATE_KEY(data[i][0], data[i][1]);");

    fs.writeFileSync(file, content);
});

console.log('Keys updated.');
